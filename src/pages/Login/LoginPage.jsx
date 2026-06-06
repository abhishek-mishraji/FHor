import { useContext, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AppContext } from '../../context/appContext'
import { DEFAULT_ROLE_HOME } from '../../constants/routeConstants'
import { useAuth } from '../../hooks/useAuth'
import { handleServiceError } from '../../utils/errorHandler'
import { validateLoginForm } from '../../validations/authValidation'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import TextInput from '../../components/forms/TextInput'
import '../../page-styles/Login/Login.css'

const initialValues = {
  email: '',
  password: '',
}

function LoginPage() {
  const location = useLocation()
  const { notify } = useContext(AppContext)
  const { isAuthenticated, login, user } = useAuth()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={DEFAULT_ROLE_HOME[user?.role]} replace />
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const nextErrors = validateLoginForm(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      return
    }

    setSubmitting(true)

    try {
      const loggedInUser = await login(values)

      notify({
        type: 'success',
        title: 'Welcome back',
        message: `Signed in as ${loggedInUser.fullName}.`,
      })
    } catch (error) {
      const details = handleServiceError(error)
      setErrors(details.fieldErrors)
      notify({
        type: 'error',
        title: 'Sign in failed',
        message: details.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__hero">
        <p className="login-page__eyebrow">Enterprise Retail Intelligence</p>
        <h1>Hands of Retail dashboard for governed store operations.</h1>
        <p>
          Session access is protected by HttpOnly cookie authentication, automatic refresh, and role-aware
          routing across admin and client workspaces.
        </p>
        {location.state?.from ? (
          <div className="login-page__notice">
            Please sign in to continue to {location.state.from.pathname}.
          </div>
        ) : null}
      </div>

      <Card
        className="login-page__card"
        title="Sign in"
        subtitle="Use your administrator or client account to access the workspace."
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="admin@gmail.com"
            autoComplete="email"
          />
          <TextInput
            label="Password"
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Enter password"
            autoComplete="current-password"
          />
          <Button type="submit" isLoading={submitting}>
            Access dashboard
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default LoginPage
