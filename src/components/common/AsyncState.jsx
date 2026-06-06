import EmptyState from '../ui/EmptyState'
import Loader from '../ui/Loader'

const AsyncState = ({
  isLoading,
  error,
  isEmpty,
  emptyTitle,
  emptyDescription,
  children,
}) => {
  if (isLoading) {
    return <Loader />
  }

  if (error) {
    return (
      <EmptyState
        title="Something went wrong"
        description={error?.response?.data?.message || error?.message || 'Please try again.'}
      />
    )
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return children
}

export default AsyncState
