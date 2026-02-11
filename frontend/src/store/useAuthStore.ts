import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  company: {
    id: string;
    name: string;
  };
}

/**
 * 用户认证状态管理 (Zustand Store)
 * 
 * 功能:
 * - 管理 JWT Token 和用户信息
 * - 自动持久化到 localStorage ('auth-storage')
 * - 提供登录(setAuth)、登出(logout)和鉴权状态检查(isAuthenticated)
 */
interface AuthStore {
  token: string | null; // JWT 访问令牌
  user: User | null;    // 当前登录用户信息
  setAuth: (token: string, user: User) => void; // 登录成功后调用
  logout: () => void;   // 登出时调用 (清除状态)
  isAuthenticated: () => boolean; // 检查是否已登录
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      setAuth: (token, user) => set({ token, user }),
      
      logout: () => set({ token: null, user: null }),

      // 简易鉴权：仅检查 Token 是否存在 (更严格的检查应由后端 Guard 处理)
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'auth-storage', // localStorage 中的 Key
    }
  )
);
