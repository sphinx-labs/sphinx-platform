#!/bin/bash

# This setting ensures that this script will exit if any subsequent command in this script fails.
# Without this, the CI process will pass even if tests in this script fail.
set -e

cd ..
export $(grep -v '^#' .env | xargs)
cd website

export LOCAL_ANVIL=true
export NODE_OPTIONS='$NODE_OPTIONS --experimental-vm-modules'
npx jest --silent=false --verbose