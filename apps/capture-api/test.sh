#!/bin/bash
# This is our first script.
echo 'Hello World!'

# Running unit tests for capture-api
echo 'Running practice tests...'
pnpm vitest run ./tests/sum.test.js

# Running unit tests for capture-api
# echo 'Running unit tests for capture-api'

# Running systems tests for capture-api
# echo 'Running systems tests for capture-api'

# Any linters can be added below here


#use exit code 0 for success, non-zero for failure
exit 0