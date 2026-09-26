import React, { createContext, useContext, useState, useMemo } from 'react';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  loginUser: (user: User, token: string) => void;
  logoutUser: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const loginUser = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('accessToken', token);
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
  };

  const value = useMemo(() => ({
    user,
    loginUser,
    logoutUser,
    isAuthenticated: !!user
  }), [user]);

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
