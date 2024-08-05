import {createClient} from 'redis'
// import { RedisPubSub } from "graphql-redis-subscriptions";
import {REDIS_OPTIONS} from './config.js'

export const redis = await createClient(REDIS_OPTIONS)
  .on('connect', () => console.info('Redis Client Connected'))
  .on('error', err => console.error('Redis Client Error', err))
  .connect()
