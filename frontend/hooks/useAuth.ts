'use client';

import { useEffect, useState } from 'react';
import { User } from '@/types';
import { getUser, clearAuth, isAuthenticated } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getUser());
    }
    setLoading(false);
  }, []);

  const logout = () => {
    clearAuth();
    setUser(null);
    window.location.href = '/login';
  };

  return { user, loading, logout, isAuthenticated: isAuthenticated() };
}