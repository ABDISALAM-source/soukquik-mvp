import { Request, Response } from 'express';
import { ok } from '../../common/response';
import { authService } from './auth.service';
import { googleLoginSchema, loginSchema, refreshSchema, registerSchema } from './auth.types';

export const authController = {
  async register(req: Request, res: Response) {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    return ok(res, result, 201);
  },

  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    return ok(res, result);
  },

  async refresh(req: Request, res: Response) {
    const input = refreshSchema.parse(req.body);
    const result = await authService.refresh(input.refreshToken);
    return ok(res, result);
  },

  async me(req: Request, res: Response) {
    const result = await authService.me(req.user!.id);
    return ok(res, result);
  },

  async google(req: Request, res: Response) {
    const input = googleLoginSchema.parse(req.body);
    const result = await authService.loginWithGoogle(input);
    return ok(res, result);
  },
};
