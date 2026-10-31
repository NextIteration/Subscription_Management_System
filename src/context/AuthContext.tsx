import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { initialUsers } from '../data/mockData';
import { api } from '../lib/api';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  users: User[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: UserRole,
    company?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  createStaffAccount: (name: string, email: string) => Promise<{ success: boolean; message: string }>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check existing session cookie on initial app mount
  useEffect(() => {
    let mounted = true;
    async function verifySession() {
      try {
        const res = await api.get<{ user: User }>('/auth/me');
        if (mounted && res.data?.user) {
          setCurrentUser(res.data.user);
        }
      } catch {
        if (mounted) {
          setCurrentUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }
    verifySession();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post<{ message: string; user: User }>('/auth/login', {
        email: email.trim(),
        password,
      });
      setCurrentUser(res.data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed. Please check credentials.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = 'customer',
    company?: string
  ) => {
    try {
      // Map lowercase role to uppercase enum for backend
      const res = await api.post<{ message: string; user: User }>('/auth/register', {
        name,
        email: email.trim(),
        password,
        role: role.toUpperCase(),
        company,
      });
      setCurrentUser(res.data.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const createStaffAccount = async (name: string, email: string) => {
    try {
      const res = await api.post<{ message: string; staff: User }>('/auth/staff', {
        name,
        email: email.trim(),
      });
      if (res.data?.staff) {
        setUsers((prev) => [...prev, res.data.staff]);
      }
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to create staff account.' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore logout network errors
    } finally {
      setCurrentUser(null);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const res = await api.post<{ message: string }>('/auth/forgot-password', {
        email: email.trim(),
      });
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to dispatch reset email.' };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      const res = await api.post<{ message: string }>('/auth/reset-password', {
        token,
        newPassword,
      });
      return { success: true, message: res.data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to reset password.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: (currentUser?.role || 'customer') as UserRole,
        users,
        login,
        register,
        logout,
        requestPasswordReset,
        resetPassword,
        createStaffAccount,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
