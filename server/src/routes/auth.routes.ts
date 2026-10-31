import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { dbStore, UserEntity, CustomerEntity } from '../services/dbStore.js';
import { hashPassword, verifyPassword, generateToken, hashToken } from '../utils/security.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, requireRole, SESSION_COOKIE_NAME } from '../middleware/auth.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createStaffSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Helper to set HttpOnly session cookie
function setSessionCookie(res: Response, sessionId: string) {
  res.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
}

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  const { name, email, password, role = 'CUSTOMER', company } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  // Check if user already exists
  const existing = Array.from(dbStore.users.values()).find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  // Prevent direct public registration of STAFF role unless done by Admin
  if (role === 'STAFF') {
    return res.status(403).json({ error: 'Staff accounts can only be created by an Administrator.' });
  }

  const passwordHash = await hashPassword(password);
  const userId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  let customerId: string | undefined = undefined;
  if (role === 'CUSTOMER') {
    customerId = `cust-${Date.now()}`;
    const newCustomer: CustomerEntity = {
      id: customerId,
      name,
      email: normalizedEmail,
      company: company || `${name}'s Company`,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dbStore.customers.set(customerId, newCustomer);
  }

  const newUser: UserEntity = {
    id: userId,
    name,
    email: normalizedEmail,
    passwordHash,
    role,
    company: company || (role === 'ADMIN' ? 'Brightloop Admin' : `${name}'s Company`),
    customerId,
    avatar: 'https://images.unsplash.com/photo-1535713875002?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  dbStore.users.set(userId, newUser);

  // Auto-login: create session
  const sessionId = crypto.randomUUID();
  dbStore.sessions.set(sessionId, {
    userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  setSessionCookie(res, sessionId);

  res.status(201).json({
    message: 'Registration successful',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role.toLowerCase(),
      company: newUser.company,
      customerId: newUser.customerId,
      avatar: newUser.avatar,
    },
  });
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const user = Array.from(dbStore.users.values()).find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const sessionId = crypto.randomUUID();
  dbStore.sessions.set(sessionId, {
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  setSessionCookie(res, sessionId);

  res.json({
    message: 'Signed in successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      company: user.company,
      customerId: user.customerId,
      avatar: user.avatar,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  const sessionId = req.cookies[SESSION_COOKIE_NAME];
  if (sessionId) {
    dbStore.sessions.delete(sessionId);
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.json({ message: 'Signed out successfully' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      company: user.company,
      customerId: user.customerId,
      avatar: user.avatar,
    },
  });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), async (req: Request, res: Response) => {
  const { email } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const user = Array.from(dbStore.users.values()).find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );

  if (user) {
    const rawToken = generateToken();
    user.resetToken = hashToken(rawToken);
    user.resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await sendPasswordResetEmail(user.email, rawToken);
  }

  // Consistent security response
  res.json({
    message: 'If an account exists with that email address, a password reset link has been dispatched.',
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  const hashedToken = hashToken(token);

  const user = Array.from(dbStore.users.values()).find(
    (u) => u.resetToken === hashedToken && u.resetTokenExp && u.resetTokenExp > new Date()
  );

  if (!user) {
    return res.status(400).json({ error: 'Password reset link is invalid or has expired.' });
  }

  user.passwordHash = await hashPassword(newPassword);
  user.resetToken = undefined;
  user.resetTokenExp = undefined;
  user.updatedAt = new Date();

  res.json({ message: 'Password has been reset successfully. You may now log in with your new credentials.' });
});

// POST /api/auth/staff (Admin only creates staff per PRD §2.1)
router.post('/staff', requireAuth, requireRole('ADMIN'), validate(createStaffSchema), async (req: Request, res: Response) => {
  const { name, email, company } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = Array.from(dbStore.users.values()).find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const defaultPassword = 'Staff#2026!';
  const passwordHash = await hashPassword(defaultPassword);
  const newStaff: UserEntity = {
    id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    email: normalizedEmail,
    passwordHash,
    role: 'STAFF',
    company: company || 'Brightloop Internal Ops',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  dbStore.users.set(newStaff.id, newStaff);

  res.status(201).json({
    message: `Staff account created for ${name} (${normalizedEmail}). Default password: ${defaultPassword}`,
    staff: {
      id: newStaff.id,
      name: newStaff.name,
      email: newStaff.email,
      role: 'staff',
      company: newStaff.company,
    },
  });
});

export default router;

