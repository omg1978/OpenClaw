# OpenClaw
Repositorio para todos los artefactos de OpenClaw

## Skills

### microsoft365

Integración con Microsoft 365 mediante Graph API. Permite interactuar con correo y calendario desde OpenClaw.

### peer-openclaw-admin

Skill portable para administrar de forma segura el otro nodo OpenClaw por SSH sobre Tailscale. Permite comprobar estado, diagnosticar problemas, consultar logs y ejecutar acciones de recuperación en el servidor remoto.

**Requisitos:**
- SSH y Bash disponibles en el sistema
- Linux como SO del nodo local
- Alias `openclaw-peer` configurado en `~/.ssh/config` apuntando al otro nodo

**Acciones disponibles:**

| Acción | Descripción | Confirmación |
|--------|-------------|:------------:|
| `status` | Estado general del nodo remoto (identidad, OpenClaw, canales, sistema, servicios) | No |
| `openclaw-status` | Estado detallado de OpenClaw y gateway | No |
| `doctor` | Diagnóstico completo con `openclaw doctor` | No |
| `security-audit` | Auditoría de seguridad profunda | No |
| `channels` | Estado de canales con sondeo | No |
| `gateway-logs` | Últimas 150 líneas del log del gateway | No |
| `gateway-restart` | Reinicia el gateway del nodo remoto | **Sí** |
| `update-dry-run` | Simula una actualización sin aplicarla | No |
| `update` | Actualiza OpenClaw en el nodo remoto | **Sí** |
| `reboot` | Reinicia el servidor remoto | **Sí** |

**Instalación:**

```bash
openclaw skills install ./peer-openclaw-admin --agent main
openclaw skills check --agent main
openclaw gateway restart
```

**Modelo de seguridad:**
- Solo ejecuta acciones predefinidas mediante el script `scripts/peer-openclaw-admin.sh`
- No construye comandos SSH arbitrarios a partir del texto del usuario
- Las acciones mutantes (`reboot`, `update`, `gateway-restart`) requieren confirmación explícita
- No expone claves privadas, tokens ni secretos
