import { useContext } from 'react'
import { AppContext } from '../../context/appContext'

const ToastStack = () => {
  const { toasts, dismissToast } = useContext(AppContext)

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <div>
            {toast.title ? <strong>{toast.title}</strong> : null}
            <p>{toast.message}</p>
          </div>
          <button type="button" onClick={() => dismissToast(toast.id)}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  )
}

export default ToastStack
