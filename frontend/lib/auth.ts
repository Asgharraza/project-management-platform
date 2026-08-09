import { User } from '@/types';

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined';

export const setAuthData = (token: string, user: User) => {
  if (isBrowser) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const getToken = (): string | null => {
  if (!isBrowser) return null;
  return localStorage.getItem('token');
};

export const getUser = (): User | null => {
  if (!isBrowser) return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  if (isBrowser) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const isAuthenticated = (): boolean => {
  if (!isBrowser) return false;
  return !!getToken();
};