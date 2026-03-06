/**
 * Tests for lib/auth.js
 * - verifyAuth: 세션 기반 인증 확인
 * - isAdmin: role 또는 ADMIN_EMAILS 기반 관리자 판별
 * - verifyAdmin: 인증 + 권한 확인 결합
 */

// next-auth/getServerSession + authOptions 목킹
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('../pages/api/auth/[...nextauth]', () => ({
  authOptions: {},
}), { virtual: true });

import { getServerSession } from 'next-auth';
import { verifyAuth, isAdmin, verifyAdmin } from '../lib/auth.js';

const mockReq = {};
const mockRes = {};

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ADMIN_EMAILS;
});

// ─── verifyAuth ───────────────────────────────────────────────
describe('verifyAuth', () => {
  test('유효한 세션 → user 반환', async () => {
    getServerSession.mockResolvedValue({ user: { email: 'a@test.com', role: 'user' } });
    const user = await verifyAuth(mockReq, mockRes);
    expect(user).toEqual({ email: 'a@test.com', role: 'user' });
  });

  test('세션 없음 → Unauthorized 에러', async () => {
    getServerSession.mockResolvedValue(null);
    await expect(verifyAuth(mockReq, mockRes)).rejects.toThrow('Unauthorized');
  });

  test('세션은 있으나 user 필드 없음 → Unauthorized 에러', async () => {
    getServerSession.mockResolvedValue({});
    await expect(verifyAuth(mockReq, mockRes)).rejects.toThrow('Unauthorized');
  });

  test('getServerSession 실패 → 에러 전파', async () => {
    getServerSession.mockRejectedValue(new Error('DB error'));
    await expect(verifyAuth(mockReq, mockRes)).rejects.toThrow('DB error');
  });
});

// ─── isAdmin ──────────────────────────────────────────────────
describe('isAdmin', () => {
  test('role === admin → true', () => {
    expect(isAdmin({ role: 'admin', email: 'x@test.com' })).toBe(true);
  });

  test('role !== admin, ADMIN_EMAILS 미설정 → false', () => {
    expect(isAdmin({ role: 'user', email: 'x@test.com' })).toBe(false);
  });

  test('이메일이 ADMIN_EMAILS에 포함 → true', () => {
    process.env.ADMIN_EMAILS = 'admin@kulture.co,super@kulture.co';
    expect(isAdmin({ role: 'user', email: 'admin@kulture.co' })).toBe(true);
  });

  test('이메일이 ADMIN_EMAILS에 미포함 → false', () => {
    process.env.ADMIN_EMAILS = 'admin@kulture.co';
    expect(isAdmin({ role: 'user', email: 'other@test.com' })).toBe(false);
  });

  test('role=admin이면 ADMIN_EMAILS 무관하게 true', () => {
    process.env.ADMIN_EMAILS = 'admin@kulture.co';
    expect(isAdmin({ role: 'admin', email: 'anyone@test.com' })).toBe(true);
  });
});

// ─── verifyAdmin ──────────────────────────────────────────────
describe('verifyAdmin', () => {
  test('관리자 세션 → user 반환', async () => {
    getServerSession.mockResolvedValue({ user: { email: 'a@test.com', role: 'admin' } });
    const user = await verifyAdmin(mockReq, mockRes);
    expect(user.role).toBe('admin');
  });

  test('세션 없음 → Unauthorized 에러', async () => {
    getServerSession.mockResolvedValue(null);
    await expect(verifyAdmin(mockReq, mockRes)).rejects.toThrow('Unauthorized');
  });

  test('로그인은 됐지만 admin이 아님 → Forbidden 에러', async () => {
    getServerSession.mockResolvedValue({ user: { email: 'a@test.com', role: 'user' } });
    await expect(verifyAdmin(mockReq, mockRes)).rejects.toThrow('Forbidden');
  });

  test('ADMIN_EMAILS로 관리자 승격 → 통과', async () => {
    process.env.ADMIN_EMAILS = 'special@kulture.co';
    getServerSession.mockResolvedValue({ user: { email: 'special@kulture.co', role: 'user' } });
    const user = await verifyAdmin(mockReq, mockRes);
    expect(user.email).toBe('special@kulture.co');
  });
});
