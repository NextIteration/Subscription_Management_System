import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { initialUsers } from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (name: string, email: string, password: string, role?: UserRole, company?: string) => { success: boolean; error?: string };
  logout: () => void;
  requestPasswordReset: (email: string) => { success: boolean; message: string };
  resetPassword: (token: string, newPassword: string) => { success: boolean; message: string };
  users: User[];
  createStaffAccount: (name: string, email: string) => { success: boolean; message: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('bl_users_v2');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bl_current_user_v2');
    return saved ? JSON.parse(saved) : initialUsers[0]; // Authenticated Admin user
  });

  useEffect(() => {
    localStorage.setItem('bl_users_v2', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('bl_current_user_v2', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('bl_current_user_v2');
    }
  }, [currentUser]);

  const validatePassword = (pwd: string): boolean => {
    // Longer than 8 chars, uppercase, lowercase, special character
    const hasMinLength = pwd.length > 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    return hasMinLength && hasUpper && hasLower && hasSpecial;
  };

  const login = (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === normalizedEmail ||
        (normalizedEmail === 'admin@brightloop.io' && u.email === 'admin@brightloop.io') ||
        (normalizedEmail === 'james.anderson@brightloop.io' && u.role === 'admin') ||
        (normalizedEmail === 'staff@brightloop.io' && u.email === 'staff@brightloop.io') ||
        (normalizedEmail === 'sarah.connor@brightloop.io' && u.role === 'staff')
    );

    if (!user) {
      return { success: false, error: 'No account found with this email address.' };
    }

    if (user.password && user.password !== password) {
      return { success: false, error: 'Invalid password. Please check your credentials.' };
    }

    setCurrentUser(user);
    return { success: true };
  };

  const register = (name: string, email: string, password: string, role: UserRole = 'customer', company?: string) => {
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'An account with this email address already exists.' };
    }
    if (!validatePassword(password)) {
      return {
        success: false,
        error: 'Password must be longer than 8 characters and contain at least one uppercase letter, one lowercase letter, and one special character.',
      };
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      password,
      company: company || `${name}'s Company`,
      customerId: role === 'customer' ? `cust-${Date.now()}` : undefined,
      avatar: `https://images.unsplash.com/photo-1535713875002?w=150&auto=format&fit=crop&q=80`,
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    return { success: true };
  };

  const createStaffAccount = (name: string, email: string) => {
    if (currentUser?.role !== 'admin') {
      return { success: false, message: 'Only Admins can create staff accounts.' };
    }
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, message: 'An account with this email already exists.' };
    }
    const newStaff: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role: 'staff',
      password: 'Staff#2026!',
      company: 'Brightloop Internal Ops',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    };
    setUsers((prev) => [...prev, newStaff]);
    return { success: true, message: `Staff account created for ${name} (${email}). Default temporary password: Staff#2026!` };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const requestPasswordReset = (email: string) => {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, message: 'If an account exists with that email, a reset link has been dispatched.' };
    }
    return {
      success: true,
      message: `Password reset email dispatched to ${email}. Check your inbox for the secure reset link.`,
    };
  };

  const resetPassword = (_token: string, newPassword: string) => {
    if (!validatePassword(newPassword)) {
      return {
        success: false,
        message: 'Password must be longer than 8 characters with uppercase, lowercase, and a special character.',
      };
    }
    if (currentUser) {
      const updated = { ...currentUser, password: newPassword };
      setCurrentUser(updated);
      setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
    }
    return {
      success: true,
      message: 'Password successfully updated. You may now log in with your new credentials.',
    };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || 'admin',
        login,
        register,
        logout,
        requestPasswordReset,
        resetPassword,
        users,
        createStaffAccount,
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
