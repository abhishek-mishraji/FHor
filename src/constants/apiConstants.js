import environment from '../config/environment'

export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
}

export const API_RESPONSE_FIELDS = {
  success: 'success',
  message: 'message',
  data: 'data',
  errors: 'errors',
  timestamp: 'timestamp',
}

export const QUERY_DEFAULTS = {
  page: 1,
  pageSize: environment.defaultPageSize,
  debounceMs: environment.debounceMs,
}

export const REQUEST_CONFIG = {
  timeout: environment.requestTimeout,
  baseURL: environment.apiBaseUrl,
}
