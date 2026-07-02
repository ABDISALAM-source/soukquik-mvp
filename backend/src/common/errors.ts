export class AppError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const Errors = {
  badRequest: (msg = 'Requête invalide') => new AppError(400, msg),
  unauthorized: (msg = 'Non authentifié') => new AppError(401, msg),
  forbidden: (msg = 'Accès refusé') => new AppError(403, msg),
  notFound: (msg = 'Ressource introuvable') => new AppError(404, msg),
  conflict: (msg = 'Conflit') => new AppError(409, msg),
};
