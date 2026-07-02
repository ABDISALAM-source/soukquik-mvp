import dotenv from 'dotenv';
dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: required('DATABASE_URL', process.env.DATABASE_URL_TEST || 'postgres://soukquik:soukquik@localhost:5432/soukquik'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET', 'dev_access_secret'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev_refresh_secret'),
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
