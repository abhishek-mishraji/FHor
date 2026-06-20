import { useContext, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AppContext } from '../../context/appContext'
import { DEFAULT_ROLE_HOME, ROUTES } from '../../constants/routeConstants'
import { useAuth } from '../../hooks/useAuth'
import { handleServiceError } from '../../utils/errorHandler'
import { validateLoginForm } from '../../validations/authValidation'
import Button from '../../components/ui/Button'
import TextInput from '../../components/forms/TextInput'
import horLogo from '../../assets/hor-logo.png'
import '../../page-styles/Login/Login.css'

const initialValues = {
  email: '',
  password: '',
}

function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
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
      <div className="login-panel">
        <div className="login-panel__logo-wrap">
          <img className="login-panel__logo" src={horLogo} alt="Hands Off Retail" />
        </div>

        <hr className="login-panel__divider" />

        <h2 className="login-panel__title">CStore Essentials</h2>

        {location.state?.from ? (
          <div className="login-panel__notice">
            Please sign in to continue to {location.state.from.pathname}.
          </div>
        ) : null}

        <form className="form-grid" onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="Email"
            autoComplete="email"
          />
          <TextInput
            label="Password"
            name="password"
            type="password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Password"
            autoComplete="current-password"
          />
          <Button type="submit" className="login-panel__btn" isLoading={submitting}>
            Login
          </Button>
        </form>

        <button className="login-panel__home-btn" onClick={() => navigate(ROUTES.landing)}>
          ← Back to Home
        </button>
      </div>
    </div>
  )
}

export default LoginPage
