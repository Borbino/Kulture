import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import bcrypt from 'bcryptjs'
import { getSanityClient } from '../../../lib/sanityClient'

export const authOptions = {
  providers: [
    // 이메일/비밀번호 인증
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

        // 사용자 조회
        const user = await client.fetch(
          '*[_type == "user" && email == $email][0]',
          { email: credentials.email }
        )

        if (!user) {
          throw new Error('등록되지 않은 이메일입니다')
        }

        // 비밀번호 검증
        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('비밀번호가 일치하지 않습니다')
        }

        // 마지막 로그인 시간 업데이트
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

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),

    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile: _profile }) {
      if (account.provider === 'google' || account.provider === 'github') {
        const client = getSanityClient()

        // 기존 사용자 확인
        const existingUser = await client.fetch(
          '*[_type == "user" && email == $email][0]',
          { email: user.email }
        )

        if (!existingUser) {
          // 신규 사용자 생성
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
          // 로그인 시간 업데이트
          await client
            .patch(existingUser._id)
            .set({ lastLoginAt: new Date().toISOString() })
            .commit()
        }
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
