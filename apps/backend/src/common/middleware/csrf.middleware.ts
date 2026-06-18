import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 1. Ensure the XSRF-TOKEN cookie exists
    let token = req.cookies?.['XSRF-TOKEN'];
    if (!token) {
      token = randomBytes(32).toString('hex');
      res.cookie('XSRF-TOKEN', token, {
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false, // Must be readable by frontend JS to set the header
        path: '/',
      });
    }

    // 2. Validate state-changing requests
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (!safeMethods.includes(req.method)) {
      const headerToken = req.headers['x-xsrf-token'];
      if (!headerToken || headerToken !== token) {
        throw new ForbiddenException('Invalid CSRF token');
      }
    }

    next();
  }
}
