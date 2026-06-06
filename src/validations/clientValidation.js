export const validateClientForm = (values, { isEdit = false } = {}) => {
  const errors = {}

  if (!values.fullName?.trim()) {
    errors.fullName = 'Full name is required.'
  }

  if (!values.email?.trim()) {
    errors.email = 'Email is required.'
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!isEdit && !values.password?.trim()) {
    errors.password = 'Password is required.'
  }

  return errors
}
