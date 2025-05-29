export const formatDate = (date) => {
  return date.toISOString().split('T')[0]
}

export const parseDatabaseDate = (dateString) => {
  return new Date(dateString)
}
