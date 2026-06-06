export const validateStoreForm = (values) => {
  const errors = {}

  if (!values.clientId) {
    errors.clientId = 'Owner selection is required.'
  }

  if (!values.storeName?.trim()) {
    errors.storeName = 'Store name is required.'
  }

  if (!values.storeCode?.trim()) {
    errors.storeCode = 'Store code is required.'
  }

  return errors
}

export const validateStoreMemberForm = (values) => {
  const errors = {}

  if (!values.storeId) {
    errors.storeId = 'Store is required.'
  }

  if (!values.clientId) {
    errors.clientId = 'Client is required.'
  }

  if (!values.role) {
    errors.role = 'Member role is required.'
  }

  return errors
}
