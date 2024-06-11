import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { syncNetworks } from './backfill-networks'

dotenv.config()

const prisma = new PrismaClient()

syncNetworks(prisma)
