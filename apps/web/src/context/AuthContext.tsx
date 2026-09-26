import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  loginUser: (user: User, token: string) => void;
  logoutUser: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if we have a token and rehydrate the user
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      })
      .then(res => {
        if (res.data && res.data.user) {
          setUser(res.data.user);
        } else {
          localStorage.removeItem('accessToken');
        }
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = useCallback((userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('accessToken', token);
  }, []);

  const logoutUser = useCallback(() => {
    setUser(null);
    localStorage.removeItem('accessToken');
    axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true }).catch(() => {});
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    loginUser,
    logoutUser,
    isAuthenticated: !!user
  }), [user, loading, loginUser, logoutUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
