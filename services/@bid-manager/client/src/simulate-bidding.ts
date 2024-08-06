import {client} from './client.js'

const ONE_MINUTE = 60 * 1000
const paddles = ['R-1', 'R-2', 'P-3', 'P-4']
const lotId = '6e8bc430-9c3a-11d9-9669-0800200c9a66'

let bidCount = 0
let lastAmount = 100
let lastPaddle = 'R-1'
const endTime = Date.now() + ONE_MINUTE

while (Date.now() < endTime) {
  let nextPaddle = lastPaddle
  while (nextPaddle === lastPaddle) {
    const randomPaddle = paddles[Math.floor(Math.random() * paddles.length)]
    nextPaddle = randomPaddle ?? lastPaddle
  }

  let nextAmount = lastAmount + Math.floor(Math.random() * 75) * 100
  const res = await client.placeBid({
    paddleId: nextPaddle,
    lotId: lotId,
    amount: nextAmount
  })

  bidCount++
  lastAmount = nextAmount
  lastPaddle = nextPaddle
  // console.log(res.bid)
}
console.log(`Placed ${bidCount} bids`)
console.log({lastAmount, lastPaddle})
