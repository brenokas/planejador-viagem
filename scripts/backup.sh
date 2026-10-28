#!/usr/bin/env bash
# Gera um backup do banco em ./backups/planejador-AAAA-MM-DD_HHMM.sql.gz
# Mantém os 30 backups mais recentes.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p backups

arquivo="backups/planejador-$(date +%F_%H%M).sql.gz"
docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" planejador' | gzip > "$arquivo"
echo "Backup salvo em $arquivo"

ls -1t backups/planejador-*.sql.gz | tail -n +31 | xargs -r rm --
