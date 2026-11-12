import { env } from '../config/env.js'
import { HttpError } from '../utils/http-error.js'

export type PayPalCapture = {
  id?: string
  status?: string
  amount?: { value?: string; currency_code?: string }
  create_time?: string
  update_time?: string
}

export type PayPalOrder = {
  id?: string
  status?: string
  payer?: { payer_id?: string; email_address?: string }
  purchase_units?: Array<{
    custom_id?: string
    reference_id?: string
    invoice_id?: string
    amount?: { value?: string; currency_code?: string }
    payments?: { captures?: PayPalCapture[] }
  }>
}

let cachedToken: { value: string; expiresAt: number } | undefined

function requireCredentials() {
  if (!env.paypalClientId || !env.paypalClientSecret) {
    throw new HttpError(503, 'PayPal is not configured on this server', 'PAYPAL_NOT_CONFIGURED')
  }
}

export async function getPayPalAccessToken() {
  requireCredentials()
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value

  const response = await fetch(`${env.paypalApiBaseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.paypalClientId}:${env.paypalClientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!response.ok) throw new HttpError(502, 'PayPal authentication failed', 'PAYPAL_AUTH_FAILED')
  const token = await response.json() as { access_token?: string; expires_in?: number }
  if (!token.access_token) throw new HttpError(502, 'PayPal returned an invalid access token response', 'PAYPAL_AUTH_FAILED')
  cachedToken = { value: token.access_token, expiresAt: Date.now() + Math.max(60, token.expires_in ?? 300) * 1000 }
  return cachedToken.value
}

export async function paypalRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const accessToken = await getPayPalAccessToken()
  const response = await fetch(`${env.paypalApiBaseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  if (!response.ok) {
    const status = response.status >= 500 ? 502 : 400
    throw new HttpError(status, `PayPal request failed (${response.status})`, 'PAYPAL_REQUEST_FAILED')
  }
  if (response.status === 204) return undefined as T
  return await response.json() as T
}

export async function verifyPayPalWebhook(headers: {
  authAlgo?: string
  certUrl?: string
  transmissionId?: string
  transmissionSignature?: string
  transmissionTime?: string
}, event: unknown) {
  if (!env.paypalWebhookId) throw new HttpError(503, 'PayPal webhook verification is not configured', 'PAYPAL_WEBHOOK_NOT_CONFIGURED')
  const { authAlgo, certUrl, transmissionId, transmissionSignature, transmissionTime } = headers
  if (!authAlgo || !certUrl || !transmissionId || !transmissionSignature || !transmissionTime) {
    throw new HttpError(400, 'Required PayPal signature headers are missing', 'PAYPAL_SIGNATURE_HEADERS_MISSING')
  }
  const result = await paypalRequest<{ verification_status?: string }>('/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSignature,
      transmission_time: transmissionTime,
      webhook_id: env.paypalWebhookId,
      webhook_event: event,
    }),
  })
  return result.verification_status === 'SUCCESS'
}

export function isPayPalConfigured() {
  return Boolean(env.paypalClientId && env.paypalClientSecret)
}
