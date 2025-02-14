const getEnvVar = (key: string): string => {
  const value = import.meta.env[key]
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`)
  }
  return value
}

export const config = {
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL'),
  // debugMode: getEnvVar('DEBUG_MODE') === 'true'
} as const 