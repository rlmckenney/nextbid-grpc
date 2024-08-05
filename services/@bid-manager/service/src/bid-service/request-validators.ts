/**
 * The `proto3` syntax does not allow defining required fields.
 * Any fields not provided in the request will be set to default values
 * according to their type.
 *
 * e.g. 0 for numbers, '' for strings, false for bool.
 *
 * So, while Protobuf provides some type safety, the responsibility
 * for constraint validation still remains with the application.
 *
 * @see https://developers.google.com/protocol-buffers/docs/proto3#default
 */

import {z} from 'zod'

const MIN_BID_AMOUNT = 100
const MAX_TIMESTAMP = 253402300799999 // 9999-12-31T23:59:59.999Z
const MIN_TIMESTAMP = 0 // 1970-01-01T00:00:00.000Z

const amountSchema = z.number().safe().positive().min(MIN_BID_AMOUNT)
const timestampSchema = z.number().int().min(MIN_TIMESTAMP).max(MAX_TIMESTAMP)

export const placeBidRequestSchema = z.object({
  paddleId: z.string(),
  lotId: z.string().uuid(),
  amount: amountSchema
})
