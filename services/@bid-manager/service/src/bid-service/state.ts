/**
 * @module bid-service/state
 * @description This module contains the shared state management functions
 * for the bid service. The state is stored in Redis.
 */

import {IssueData} from 'zod'
import {redis} from '../redis-connection.js'
import {Bid, BidStatus} from '@bid-manager/definition'

const AUCTION_ID = '1'

// Write a new BidEvent to the 'bids-placed' Redis stream
export async function publishBidEvent(bid: Bid) {
  const bidEventId = await redis.xAdd(
    getBidStreamKey(AUCTION_ID, bid.lotId),
    '*',
    createEventMessageFromBid(bid)
  )
  return bidEventId
}

type BidHash = Record<string, string | number>

export async function getTopBidForLot(auctionId: string, lotId: string) {
  const topBid = (await redis.hGetAll(
    getTopBidKey(auctionId, lotId)
  )) as BidHash
  return new Bid(topBid)
}

export async function setTopBidForLot(bid: Bid) {
  // add logic to notify previous top bidder
  // convert bid to plain object
  const bidObj = bid.toJson() as BidHash
  // store in the top bid hash
  const key = getTopBidKey(AUCTION_ID, bid.lotId)
  return redis.hSet(key, bidObj)
}

export async function isTopBid(newBid: Bid) {
  const key = getTopBidKey(AUCTION_ID, newBid.lotId)
  const [amount, timePlaced] = (await redis.hmGet(key, [
    'amount',
    'timePlaced'
  ])) as [string, string]

  const topAmount = parseInt(amount)
  if (topAmount > newBid.amount) return false

  if (topAmount == newBid.amount) {
    const topTime = new Date(timePlaced)
    const newTime = newBid.timePlaced!.toDate()
    if (topTime < newTime) return false
  }

  return true
}

export async function acceptBid(bid: Bid) {
  bid.status = BidStatus.ACCEPTED
  await setTopBidForLot(bid)
  await publishBidEvent(bid)
  return bid
}

export async function rejectBid(bid: Bid) {
  bid.status = BidStatus.REJECTED
  await publishBidEvent(bid)
  return bid
}

// DATA TRANSFORMATIONS: Helper functions

/**
 * Transform a Bid object into a Redis stream compatible message.
 * All fields must be strings.
 */
function createEventMessageFromBid(bid: Bid) {
  return {
    ...bid,
    amount: bid.amount.toString(),
    status: bid.status.toString(),
    timePlaced: bid.timePlaced?.toDate().getTime().toString() || ''
  }
}

// REDIS KEYS: Helper functions

/**
 * Get the key prefix for a lot in an auction.
 * @param {string} auctionId - The ID of the auction.
 * @param {string} lotId - The ID of the lot.
 * @returns {string} The key prefix.
 */
function getKeyPrefix(auctionId: string, lotId: string) {
  return `auction:${auctionId}:lot:${lotId}`
}

/**
 * Get the key for the bid stream for a lot in an auction.
 * @param {string} auctionId - The ID of the auction.
 * @param {string} lotId - The ID of the lot.
 * @returns {string} The key for the bid stream.
 */
function getBidStreamKey(auctionId: string, lotId: string) {
  const prefix = getKeyPrefix(auctionId, lotId)
  return `${prefix}:bids-placed`
}

/**
 * Get the key for the top bid for a lot in an auction.
 * @param {string} auctionId - The ID of the auction.
 * @param {string} lotId - The ID of the lot.
 * @returns {string} The key for the top bid.
 */
function getTopBidKey(auctionId: string, lotId: string) {
  const prefix = getKeyPrefix(auctionId, lotId)
  return `${prefix}:top-bid`
}

/**
 * Get the key for the lock flag of any other key.
 * @param {string} key - The redis key to lock.
 * @returns {string} The key for the lock flag.
 */
function getLockKey(key: string) {
  return `lock:${key}`
}

// scratch

// const acquireLock = async (
//   lockName: string,
//   acquireTimeout: number = 10000,
//   lockTimeout: number = 10000
// ): Promise<boolean> => {
//   const lockKey = `lock:${lockName}`;
//   const end = Date.now() + acquireTimeout;

//   while (Date.now() < end) {
//     const result = await redis.set(lockKey, 'locked', 'NX', 'PX', lockTimeout);
//     if (result === 'OK') {
//       return true;
//     }
//     await new Promise((resolve) => setTimeout(resolve, 10));
//   }

//   return false;
// };

// const releaseLock = async (lockName: string): Promise<void> => {
//   const lockKey = `lock:${lockName}`;
//   await redis.del(lockKey);
// };

// const criticalSection = async (): Promise<void> => {
//   const lockName = 'my_lock';
//   const lockAcquired = await acquireLock(lockName);

//   if (lockAcquired) {
//     try {
//       // Perform your read/write operation here
//       console.log('Operation in progress...');
//       await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate operation duration
//     } finally {
//       await releaseLock(lockName);
//     }
//   } else {
//     console.log('Could not acquire lock');
//   }
// };

// criticalSection().catch(console.error);
