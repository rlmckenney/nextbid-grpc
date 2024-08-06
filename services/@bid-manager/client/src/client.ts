import {createPromiseClient} from '@connectrpc/connect'
import {createConnectTransport} from '@connectrpc/connect-node'
// import {createGrpcTransport} from '@connectrpc/connect-node'
import {BidService} from '@bid-manager/definition'

const transport = createConnectTransport({
  baseUrl: 'https://localhost:8443',
  httpVersion: '2'
})

export const client = createPromiseClient(BidService, transport)
