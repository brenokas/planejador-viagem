#!/usr/bin/env bash
# Agenda (ou remove) o backup diário do banco no crontab do usuário.
#   ./scripts/agendar-backup.sh           → agenda às 03:00 todos os dias
#   ./scripts/agendar-backup.sh remover   → remove o agendamento
# Pode ser rodado mais de uma vez: não duplica a linha.
set -euo pipefail

raiz="$(cd "$(dirname "$0")/.." && pwd)"
marca="# planejador-de-viagem: backup diario"
linha="0 3 * * * cd \"$raiz\" && ./scripts/backup.sh >> \"$raiz/backups/backup.log\" 2>&1 $marca"

atual="$(crontab -l 2>/dev/null | grep -vF "$marca" || true)"

if [[ "${1:-}" == "remover" ]]; then
  printf '%s\n' "$atual" | sed '/^$/d' | crontab -
  echo "Backup diário removido do crontab."
  exit 0
fi

mkdir -p "$raiz/backups"
printf '%s\n%s\n' "$atual" "$linha" | sed '/^$/d' | crontab -
echo "Backup agendado para 03:00 todos os dias. Log em backups/backup.log"
echo "O computador precisa estar ligado nesse horário."
