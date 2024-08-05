const loggerConfigs = {
  development: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  },
  production: true,
  test: false
}
type Environment = keyof typeof loggerConfigs

function isEnvironment(environment: string): environment is Environment {
  return environment in loggerConfigs
}

function getEnvironment(): Environment {
  const environment = process.env.NODE_ENV || 'development'
  if (!isEnvironment(environment)) {
    throw new Error(`Invalid environment: ${environment}`)
  }
  return environment
}

export function getLoggerConfig() {
  const environment = getEnvironment()
  return loggerConfigs[environment]
}
