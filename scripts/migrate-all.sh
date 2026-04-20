#!/bin/bash

# Load ALL_DBS from .env
ALL_DBS=$(grep '^ALL_DBS=' .env | cut -d'=' -f2- | tr -d '[]')
IFS=',' read -ra DBS <<< "$ALL_DBS"


for DB in "${DBS[@]}"; do
  # Remove leading/trailing spaces
  DB=$(echo "$DB" | xargs)
  echo "Migrating: $DB"
  DB_MAIN="$DB" node --loader ts-node/esm node_modules/.bin/knex migrate:latest
  if [ $? -ne 0 ]; then
    echo "Migration failed for $DB"
    exit 1
  fi
done
