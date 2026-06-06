export const STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
}

export const STATUS_LABELS = {
  [STATUS.ACTIVE]: 'Active',
  [STATUS.INACTIVE]: 'Inactive',
}

export const STATUS_OPTIONS = Object.values(STATUS).map((value) => ({
  label: STATUS_LABELS[value],
  value,
}))
