import { Request, Response, NextFunction } from 'express';
import { dbStore, UserEntity } from '../services/dbStore.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: UserEntity;
      sessionId?: string;
    }
  }
}

export const SESSION_COOKIE_NAME = 'bl_session_id';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionId = req.cookies[SESSION_COOKIE_NAME];
  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const session = dbStore.sessions.get(sessionId);
  if (!session || session.expiresAt < new Date()) {
    if (session) dbStore.sessions.delete(sessionId);
    res.clearCookie(SESSION_COOKIE_NAME);
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }

  const user = dbStore.users.get(session.userId);
  if (!user) {
    dbStore.sessions.delete(sessionId);
    res.clearCookie(SESSION_COOKIE_NAME);
    return res.status(401).json({ error: 'User account no longer exists.' });
  }

  req.user = user;
  req.sessionId = sessionId;
  next();
}

export function requireRole(...allowedRoles: ('ADMIN' | 'STAFF' | 'CUSTOMER')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`,
      });
    }

    next();
  };
}

