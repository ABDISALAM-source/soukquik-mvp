import { NextFunction, Request, Response } from 'express';

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

// Enveloppe un handler async pour transmettre automatiquement les erreurs à Express
export const asyncHandler = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res, next).catch(next);
};
