import bcrypt from 'bcryptjs'
import { getSanityClient } from '../../../lib/sanityClient'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, password } = req.body

  // 입력 검증
  if (!name || !email || !password) {
    return res.status(400).json({ error: '모든 항목을 입력해주세요' })
  }

  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({ error: '이름은 2-50자 사이여야 합니다' })
  }

  if (password.length < 8) {
    return res.status(400).json({ error: '비밀번호는 최소 8자 이상이어야 합니다' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: '올바른 이메일 형식이 아닙니다' })
  }

  try {
    const client = getSanityClient()

    // 기존 사용자 확인
    const existingUser = await client.fetch(
      '*[_type == "user" && email == $email][0]',
      { email }
    )

    if (existingUser) {
      return res.status(409).json({ error: '이미 등록된 이메일입니다' })
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10)

    // 사용자 생성
    const user = await client.create({
      _type: 'user',
      name,
      email,
      password: hashedPassword,
      role: 'user',
      emailVerified: false,
      createdAt: new Date().toISOString(),
    })

    return res.status(201).json({
      message: '회원가입이 완료되었습니다',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('회원가입 실패:', error)
    return res.status(500).json({ error: '회원가입에 실패했습니다' })
  }
}
