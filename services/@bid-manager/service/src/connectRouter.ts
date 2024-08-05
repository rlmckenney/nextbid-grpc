import type {ConnectRouter} from '@connectrpc/connect'
import {createContextKey, createContextValues} from '@connectrpc/connect'
import {BidService} from '@bid-manager/definition'
import * as serviceMethods from './serviceMethods.js'
import {FastifyRequest, FastifyBaseLogger} from 'fastify'

export default (router: ConnectRouter) =>
  router.service(BidService, {...serviceMethods})

export const kLog = createContextKey<FastifyBaseLogger | undefined>(undefined, {
  description: 'Fastify logger'
})
export function contextValues(req: FastifyRequest) {
  const contextValues = createContextValues()
  contextValues.set(kLog, req.log)
  return contextValues
}
