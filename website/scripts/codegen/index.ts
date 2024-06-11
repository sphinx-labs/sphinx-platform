import { generate, type CodegenConfig } from '@graphql-codegen/cli'
import * as dotenv from 'dotenv'
import { printSchema } from 'graphql'
dotenv.config({
  path: '../.env',
})

import { schema } from '@/server/api/graphql/schema'

export const createCodegenConfig = (outPath: string): CodegenConfig => {
  return {
    schema: printSchema(schema),
    documents: ['src/**/*.gql'],
    hooks: {
      afterAllFileWrite: 'prettier --write',
    },
    generates: {
      [outPath]: {
        preset: 'client',
        plugins: [],
      },
    },
    config: {
      namingConvention: 'keep',
      dedupeOperationSuffix: true,
    },
  }
}

if (require.main === module) {
  generate(createCodegenConfig('types/gql/'))
}
