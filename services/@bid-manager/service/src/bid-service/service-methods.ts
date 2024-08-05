import {Timestamp} from '@bufbuild/protobuf'
import {Code, ConnectError, HandlerContext} from '@connectrpc/connect'
import {uuidv7} from 'uuidv7'
import type {
  PlaceBidRequest,
  AcceptBidRequest,
  AcceptBidResponse,
  WithdrawBidRequest,
  WithdrawBidResponse,
  GetBidRequest,
  GetBidResponse,
  ListBidsRequest,
  ListBidsResponse,
  ListBidsByPaddleRequest,
  ListBidsByPaddleResponse,
  ListBidsByLotRequest,
  ListBidsByLotResponse,
  ListBidsByStatusRequest,
  ListBidsByStatusResponse
} from '@bid-manager/definition'
import {Bid, BidStatus, PlaceBidResponse} from '@bid-manager/definition'
import {redis} from '../redis-connection.js'
import {getErrorMessage} from '../utils.js'
import {kLog} from '../connect-router.js'
import {placeBidRequestSchema} from './request-validators.js'
import {fromZodError} from 'zod-validation-error'
import {ZodError} from 'zod'

type BidEvent = {
  id: string
  message: {
    id: string
    paddleId: string
    lotId: string
    amount: string
    timePlaced: string
    status: BidStatus
  }
}

const AUCTION_ID = '1'

function getRedisKey(auctionId: string, lotId: string) {
  return `auction:${auctionId}:lot:${lotId}:bids-placed`
}

export async function placeBid(
  request: PlaceBidRequest,
  ctx: HandlerContext
): Promise<PlaceBidResponse> {
  const logPrefix = `[${ctx.service.typeName}/${ctx.method.name}]`
  const log = ctx.values.get(kLog)!
  log.info(request, `${logPrefix} request payload`)

  try {
    // Check for required fields and apply any domain validation manually.
    const parsedParams = placeBidRequestSchema.parse(request)

    // Construct a new bid from the request params
    const bid = new Bid(parsedParams)
    bid.id = uuidv7()
    bid.status = BidStatus.PENDING
    bid.timePlaced = Timestamp.now()

    // Transform the bid into a Redis stream compatible message
    // All fields must be strings
    const eventMessage = {
      ...bid,
      amount: bid.amount.toString(),
      status: bid.status.toString(),
      timePlaced: bid.timePlaced.toDate().getTime().toString()
    }

    // Add the bid to the 'bids-placed' Redis stream
    const bidEventId = await redis.xAdd(
      getRedisKey(AUCTION_ID, bid.lotId),
      '*',
      eventMessage
    )
    log.info({bidEventId}, `${logPrefix} bid placed`)
    return new PlaceBidResponse({bid})
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error)
      log.info(validationError.details, `${logPrefix} validation error`)
      throw new ConnectError(validationError.toString(), Code.InvalidArgument)
    }
    log.error(error, `${logPrefix} unexpected error`)
    throw new ConnectError(getErrorMessage(error), Code.Unknown)
  }
}

// async function getBid(
//   call: ServerUnaryCall<GetBidRequest, GetBidResponse>,
//   callback: sendUnaryData<GetBidResponse>
// ) {
//   callback({code: status.UNIMPLEMENTED}, null)
// }

// async function listBids(
//   call: ServerUnaryCall<ListBidsRequest, ListBidsResponse>,
//   callback: sendUnaryData<ListBidsResponse>
// ) {
//   console.debug('listBids was called')
//   try {
//     const startingId = '+' // this should come from the request
//     const bidEvents = (await redis.xRevRange(REDIS_KEY, startingId, '-', {
//       COUNT: 20
//     })) as unknown as BidEvent[]
//     const bids = bidEvents.map(({message}) => {
//       const bid = Bid.create()
//       bid.id = message.id
//       bid.amount = Number(message.amount)
//       bid.lotId = message.lotId
//       bid.paddleId = message.paddleId
//       bid.status = message.status
//       bid.timePlaced = new Date(parseInt(message.timePlaced))
//       return bid
//     })
//     callback(null, {bids})
//   } catch (error) {
//     console.error(error)
//     callback({code: status.INTERNAL, details: getErrorMessage(error)}, null)
//   }
// }

// async function listBidsByPaddle(
//   call: ServerUnaryCall<ListBidsByPaddleRequest, ListBidsByPaddleResponse>,
//   callback: sendUnaryData<ListBidsByPaddleResponse>
// ) {
//   callback({code: status.UNIMPLEMENTED}, null)
// }

// async function listBidsByLot(
//   call: ServerUnaryCall<ListBidsByLotRequest, ListBidsByLotResponse>,
//   callback: sendUnaryData<ListBidsByLotResponse>
// ) {
//   callback({code: status.UNIMPLEMENTED}, null)
// }

// async function listBidsByStatus(
//   call: ServerUnaryCall<ListBidsByStatusRequest, ListBidsByStatusResponse>,
//   callback: sendUnaryData<ListBidsByStatusResponse>
// ) {
//   callback({code: status.UNIMPLEMENTED}, null)
// }

// async function acceptBid(
//   call: ServerUnaryCall<AcceptBidRequest, AcceptBidResponse>,
//   callback: sendUnaryData<AcceptBidResponse>
// ) {
//   callback({code: status.UNIMPLEMENTED}, null)
// }

// async function withdrawBid(
//   call: ServerUnaryCall<WithdrawBidRequest, WithdrawBidResponse>,
//   callback: sendUnaryData<WithdrawBidResponse>
// ) {
//   callback({code: status.UNIMPLEMENTED}, null)
// }
