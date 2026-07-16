# peer-openclaw-admin

Skill portable para administrar dos instalaciones OpenClaw independientes mediante SSH sobre Tailscale.

## Requisito

Cada nodo debe definir en `~/.ssh/config` un alias llamado `openclaw-peer` que apunte al otro nodo.

## Instalación

```bash
openclaw skills install ./peer-openclaw-admin --agent main
openclaw skills check --agent main
openclaw skills info peer-openclaw-admin --agent main
```

Después inicia una sesión nueva o reinicia el gateway:

```bash
openclaw gateway restart
```
