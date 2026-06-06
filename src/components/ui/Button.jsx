import { memo } from 'react'

const Button = memo(function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  ...props
}) {
  return (
    <button
      className={`ui-button ui-button--${variant} ui-button--${size} ${className}`.trim()}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? 'Working...' : children}
    </button>
  )
})

export default Button
