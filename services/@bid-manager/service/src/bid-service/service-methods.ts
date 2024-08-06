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
import {
  acceptBid,
  isTopBid,
  lockTopBid,
  publishBidEvent,
  rejectBid,
  topBidIsLocked,
  unlockTopBid
} from './state.js'
import {fromZodError} from 'zod-validation-error'
import {ZodError} from 'zod'

export async function placeBid(
  request: PlaceBidRequest,
  ctx: HandlerContext
): Promise<PlaceBidResponse> {
  const logPrefix = `[${ctx.service.typeName}/${ctx.method.name}]`
  const log = ctx.values.get(kLog)!
  log.info(request, `${logPrefix} request payload`)

  try {
    // Check for required fields and apply any domain validation rules.
    const parsedParams = placeBidRequestSchema.parse(request)

    // Construct a new bid from the request params
    const bid = new Bid(parsedParams)
    bid.id = uuidv7()
    bid.status = BidStatus.PENDING
    bid.timePlaced = Timestamp.now()
    log.info({bid}, `${logPrefix} bid created`)

    // Add the bid to the 'bids-placed' Redis stream
    const bidEventId = await publishBidEvent(bid)
    log.info({bidEventId}, `${logPrefix} bid placed`)

    // Check if this is the highest bid for the lot
    const lock = await lockTopBid(bid)
    log.info({lock}, `${logPrefix} top bid lock set`)
    const resolvedBid = (await isTopBid(bid))
      ? await acceptBid(bid)
      : await rejectBid(bid)
    const unlockDidSucceed = await unlockTopBid(
      lock.topBidKey,
      lock.lockHolderId
    )
    log.info({unlockDidSucceed}, `${logPrefix} top bid lock released`)

    log.info({bid}, `${logPrefix} bid resolved`)
    return new PlaceBidResponse({bid: resolvedBid})
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
