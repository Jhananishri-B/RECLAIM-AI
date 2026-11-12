import 'dotenv/config'

const nodeEnv = process.env.NODE_ENV || 'development'
const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || (nodeEnv === 'production' ? '' : 'development-only-access-secret-change-me')
if (nodeEnv === 'production' && jwtAccessSecret.length < 32) throw new Error('JWT_ACCESS_SECRET must be at least 32 characters in production')
const paypalMode = process.env.PAYPAL_MODE || 'sandbox'
if (paypalMode !== 'sandbox' && paypalMode !== 'live') throw new Error('PAYPAL_MODE must be sandbox or live')

export const env = {
  port: Number(process.env.PORT) || 4000,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  nodeEnv,
  jwtAccessSecret,
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS) || 30,
  refreshCookieName: 'reclaim_refresh',
  paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
  paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID || '',
  paypalMode,
  paypalApiBaseUrl: paypalMode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com',
}
