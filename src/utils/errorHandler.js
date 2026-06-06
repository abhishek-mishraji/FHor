import { HTTP_STATUS } from '../constants/apiConstants'

const fallbackMessages = {
  [HTTP_STATUS.BAD_REQUEST]: 'Please review the highlighted information and try again.',
  [HTTP_STATUS.UNAUTHORIZED]: 'Your session is no longer valid. Please sign in again.',
  [HTTP_STATUS.FORBIDDEN]: 'You do not have permission to perform this action.',
  [HTTP_STATUS.NOT_FOUND]: 'The requested resource could not be found.',
  [HTTP_STATUS.CONFLICT]: 'The request conflicts with existing data.',
  [HTTP_STATUS.SERVER_ERROR]: 'Something went wrong on the server. Please try again.',
}

export const getErrorDetails = (error) => {
  const status = error?.response?.status || null
  const envelope = error?.response?.data || error?.envelope || {}

  return {
    status,
    title: status ? `Error ${status}` : 'Unexpected error',
    message:
      envelope.message ||
      error?.message ||
      fallbackMessages[status] ||
      'Something unexpected happened. Please try again.',
    fieldErrors: envelope.errors || {},
    timestamp: envelope.timestamp || null,
    isValidationError: status === HTTP_STATUS.BAD_REQUEST,
    isUnauthorized: status === HTTP_STATUS.UNAUTHORIZED,
    isForbidden: status === HTTP_STATUS.FORBIDDEN,
    isNotFound: status === HTTP_STATUS.NOT_FOUND,
    isConflict: status === HTTP_STATUS.CONFLICT,
  }
}

export const handleServiceError = (error, notify) => {
  const details = getErrorDetails(error)

  if (notify) {
    notify({
      type: 'error',
      title: details.title,
      message: details.message,
    })
  }

  return details
}
