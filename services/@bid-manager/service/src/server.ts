import {readFileSync} from 'node:fs'
import {fastify} from 'fastify'
import {fastifyConnectPlugin} from '@connectrpc/connect-fastify'
import routes, {contextValues} from './connect-router.js'
import {getLoggerConfig} from './config/fastify-logger.js'

const server = fastify({
  http2: true,
  https: {
    key: readFileSync('localhost-key.pem', 'utf8'),
    cert: readFileSync('localhost.pem', 'utf8')
  },
  logger: getLoggerConfig()
})
await server.register(fastifyConnectPlugin, {
  routes,
  contextValues
})
server.get('/', (_, reply) => {
  reply.type('text/plain')
  reply.send('gRPC server is running')
})
await server.listen({host: 'localhost', port: 8443})
console.log('server is listening at', server.addresses())
