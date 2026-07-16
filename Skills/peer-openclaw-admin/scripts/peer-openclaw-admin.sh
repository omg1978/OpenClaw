#!/usr/bin/env bash
set -Eeuo pipefail

PEER_HOST="${OPENCLAW_PEER_HOST:-openclaw-peer}"
SSH_OPTS=(
  -o BatchMode=yes
  -o ConnectTimeout=10
  -o ServerAliveInterval=30
  -o ServerAliveCountMax=2
)

usage() {
  cat <<'EOF'
Uso:
  peer-openclaw-admin.sh <acción>

Acciones:
  status
  openclaw-status
  doctor
  security-audit
  channels
  gateway-logs
  gateway-restart
  update-dry-run
  update
  reboot
EOF
}

remote() {
  ssh "${SSH_OPTS[@]}" "$PEER_HOST" "$@"
}

action="${1:-}"
case "$action" in
  status)
    remote 'bash -s' <<'REMOTE'
set -Eeuo pipefail
echo "===== IDENTIDAD ====="
hostnamectl --static
printf "Usuario: "; whoami
printf "Fecha UTC: "; date -u --iso-8601=seconds

echo
echo "===== OPENCLAW ====="
openclaw --version
openclaw gateway status

echo
echo "===== CANALES ====="
openclaw channels status --probe

echo
echo "===== SISTEMA ====="
uptime
free -h
df -h /
if command -v swapon >/dev/null 2>&1; then
  swapon --show || true
elif [ -x /usr/sbin/swapon ]; then
  /usr/sbin/swapon --show || true
fi

echo
echo "===== SERVICIOS FALLIDOS ====="
systemctl --failed --no-pager
REMOTE
    ;;

  openclaw-status)
    remote 'openclaw status --all; echo; openclaw gateway status'
    ;;

  doctor)
    remote 'openclaw doctor'
    ;;

  security-audit)
    remote 'openclaw security audit --deep'
    ;;

  channels)
    remote 'openclaw channels status --probe'
    ;;

  gateway-logs)
    remote 'journalctl --user -u openclaw-gateway --no-pager -n 150'
    ;;

  gateway-restart)
    remote 'set -e; systemctl --user restart openclaw-gateway; systemctl --user is-active openclaw-gateway; openclaw gateway status'
    ;;

  update-dry-run)
    remote 'openclaw update --dry-run'
    ;;

  update)
    remote 'openclaw update'
    ;;

  reboot)
    remote 'sudo -n systemctl reboot'
    ;;

  -h|--help|help|"")
    usage
    ;;

  *)
    echo "Acción no permitida: $action" >&2
    usage >&2
    exit 2
    ;;
esac
