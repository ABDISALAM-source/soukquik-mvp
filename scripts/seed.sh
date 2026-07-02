#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/../backend"
npm run db:migrate
npm run db:seed
echo "Migration + seed terminés."
