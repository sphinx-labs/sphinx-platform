import fs from 'fs'

import { generate } from '@graphql-codegen/cli'

import { createCodegenConfig } from 'scripts/codegen'

const errorString =
  'Generated types are out of date, please run `yarn gql` and commit the results.'

if (require.main === module) {
  const temporaryOutDir = 'scripts/tmp/types/gql/'
  if (!fs.existsSync(temporaryOutDir)) {
    fs.mkdirSync(temporaryOutDir, { recursive: true })
  }

  // generate GQL types
  generate(createCodegenConfig(temporaryOutDir)).then(() => {
    // Look for output files
    const files = fs.readdirSync(temporaryOutDir)
    // Loop through all generated files and check that they match those committed git
    files.forEach((file) => {
      const generatedFilePath = `types/gql/${file}`
      if (!fs.existsSync(generatedFilePath)) {
        throw new Error(errorString)
      }

      const tmpFile = fs.readFileSync(`scripts/tmp/types/gql/${file}`)
      const genFile = fs.readFileSync(generatedFilePath)

      if (!tmpFile.equals(genFile)) {
        console.log(`file ${file} is incorrect`)
        throw new Error(errorString)
      } else {
        console.log(`file ${file} is correct`)
      }
    })

    fs.rmSync('scripts/tmp/', { recursive: true, force: true })
  })
}
