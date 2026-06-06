export const normalizeApiEnvelope = (payload = {}) => ({
  success: Boolean(payload.success),
  message: payload.message || '',
  data: payload.data ?? null,
  errors: payload.errors || {},
  timestamp: payload.timestamp || null,
})

export const ensureSuccessfulResponse = (response) => {
  const envelope = normalizeApiEnvelope(response?.data)

  if (!envelope.success) {
    const error = new Error(envelope.message || 'Request failed')
    error.envelope = envelope
    error.response = response
    throw error
  }

  return envelope
}

export const extractResponseData = (response) => ensureSuccessfulResponse(response).data
