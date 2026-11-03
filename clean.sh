#!/bin/bash

set -e

echo "Starting cleanup process..."

sleep 1

#stops capture-apis postgress containers
pnpm --filter @sagas/capture-api run db:down

#stops MinIO container
pnpm --filter @sagas/capture-api run storage:down

#Stops Graph-API PostGreSQL service
pnpm --filter @sagas/graph-api run db:down

#Stops UI APIs PostGreSQL service
pnpm --filter @sagas/ui-api run db:down

#docker compose stop


echo "Cleanup process complete."

exit 0

