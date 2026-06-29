import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { SupabaseAdapter } from '@next-auth/supabase-adapter'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { getSanityClient } from '../../../lib/sanityClient.js'

// ─────────────────────────────────────────────
// Supabase Admin Client (서버 전용 — SERVICE_ROLE_KEY 사용)
// Row Level Security를 우회하여 유저 데이터를 안전하게 적재
// ─────────────────────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// ─────────────────────────────────────────────
// Supabase users 테이블 upsert 헬퍼
// OAuth 어댑터가 처리하지 않는 credentials 로그인 시
// 수동으로 Supabase에 유저 데이터를 동기화한다.
// ─────────────────────────────────────────────
async function upsertSupabaseUser({ id, email, name, image }) {
  const { error } = await supabaseAdmin
    .from('users')
    .upsert(
      {
        id,
        email,
        name,
        image,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )

  if (error) {
    // 포인트/세션 시스템에 치명적이지 않으므로 경고만 기록
    console.warn('[nextauth] Supabase users upsert 실패:', error.message)
  }
}

export const authOptions = {
  // ─────────────────────────────────────────────
  // Supabase Adapter
  // OAuth 로그인(Google, GitHub) 성공 시 users, accounts 테이블에
  // 유저 정보를 자동 적재·동기화한다.
  // 필수 Supabase 테이블 스키마:
  //   https://authjs.dev/reference/adapter/supabase
  // ─────────────────────────────────────────────
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }),

  providers: [
    // ── 이메일/비밀번호 인증 ──
    // CredentialsProvider는 어댑터의 createUser를 호출하지 않으므로
    // signIn 콜백에서 Supabase에 수동 동기화한다.
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('이메일과 비밀번호를 입력해주세요')
        }

        const client = getSanityClient()

        const user = await client.fetch(
          '*[_type == "user" && email == $email][0]',
          { email: credentials.email }
        )

        if (!user) {
          throw new Error('등록되지 않은 이메일입니다')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('비밀번호가 일치하지 않습니다')
        }

        await client
          .patch(user._id)
          .set({ lastLoginAt: new Date().toISOString() })
          .commit()

        return {
          id: user._id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),

    // ── Google OAuth ──
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),

    // ── GitHub OAuth ──
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // OAuth: Supabase 어댑터가 users·accounts 테이블을 자동 처리
      // + Sanity 레거시 동기화 유지 (하위 호환)
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          const client = getSanityClient()
          const existingUser = await client.fetch(
            '*[_type == "user" && email == $email][0]',
            { email: user.email }
          )

          if (!existingUser) {
            await client.create({
              _type: 'user',
              name: user.name,
              email: user.email,
              image: user.image,
              role: 'user',
              emailVerified: true,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            })
          } else {
            await client
              .patch(existingUser._id)
              .set({ lastLoginAt: new Date().toISOString() })
              .commit()
          }
        } catch (err) {
          console.error('[nextauth] Sanity 동기화 실패:', err)
          // Sanity 실패가 로그인을 막지 않도록 true 반환 유지
        }
      }

      // Credentials: 어댑터가 처리하지 않으므로 Supabase에 수동 upsert
      if (account?.provider === 'credentials') {
        await upsertSupabaseUser({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        })
      }

      return true
    },

    async jwt({ token, user, account }) {
      // 최초 로그인 시 유저 정보를 토큰에 적재
      if (user) {
        token.id = user.id
        token.role = user.role ?? 'user'
      }

      // Supabase 세션 동기화: OAuth access_token을 JWT에 포함
      // 클라이언트에서 supabase.auth.setSession() 호출 시 활용 가능
      if (account?.access_token) {
        token.supabaseAccessToken = account.access_token
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        // 클라이언트 측 Supabase RLS 연동을 위해 토큰 노출
        session.supabaseAccessToken = token.supabaseAccessToken ?? null
      }
      return session
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  session: {
    // JWT 전략 유지: CredentialsProvider 호환 + Serverless 친화적
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },

  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
