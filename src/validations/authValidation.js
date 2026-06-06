export const validateLoginForm = (values) => {
  const errors = {}

  if (!values.email?.trim()) {
    errors.email = 'Email is required.'
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!values.password?.trim()) {
    errors.password = 'Password is required.'
  }

  return errors
}
