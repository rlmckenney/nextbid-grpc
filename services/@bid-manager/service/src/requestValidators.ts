import {z} from 'zod'

const MINIMUM_AMOUNT = 100
const MAX_TIMESTAMP = 253402300799999 // 9999-12-31T23:59:59.999Z
const MIN_TIMESTAMP = 0 // 1970-01-01T00:00:00.000Z

const amountSchema = z.number().safe().positive().min(MINIMUM_AMOUNT)
const timestampSchema = z.number().int().min(MIN_TIMESTAMP).max(MAX_TIMESTAMP)

export const placeBidRequestSchema = z.object({
  paddleId: z.string(),
  lotId: z.string().uuid(),
  amount: amountSchema
})
