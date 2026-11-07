import 'dotenv/config'

const nodeEnv = process.env.NODE_ENV || 'development'
const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || (nodeEnv === 'production' ? '' : 'development-only-access-secret-change-me')
if (nodeEnv === 'production' && jwtAccessSecret.length < 32) throw new Error('JWT_ACCESS_SECRET must be at least 32 characters in production')

export const env = {
  port: Number(process.env.PORT) || 4000,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  nodeEnv,
  jwtAccessSecret,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS) || 30,
  refreshCookieName: 'reclaim_refresh',
}
