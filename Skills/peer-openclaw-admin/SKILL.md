---
name: peer-openclaw-admin
description: Administra de forma segura el otro nodo OpenClaw por SSH/Tailscale mediante acciones predefinidas de estado, diagnóstico, logs y recuperación.
metadata:
  openclaw:
    requires:
      bins:
        - ssh
        - bash
    os:
      - linux
---

# Peer OpenClaw Admin

Usa este skill cuando el usuario pida comprobar, diagnosticar o recuperar el otro servidor OpenClaw.

## Modelo operativo

- El servidor remoto está definido en `~/.ssh/config` con el alias `openclaw-peer`.
- Usa exclusivamente el script `{baseDir}/scripts/peer-openclaw-admin.sh`.
- No construyas comandos SSH arbitrarios a partir del texto del usuario.
- No muestres claves privadas, tokens, SecretRefs ni el contenido de ficheros de secretos.
- Antes de ejecutar una acción mutante, explica brevemente qué se va a modificar.
- Las acciones `reboot`, `update` y `gateway-restart` requieren confirmación explícita del usuario en el mismo turno.
- Si una acción falla, muestra el error y no encadenes acciones destructivas adicionales.

## Acciones permitidas

### Estado general
```bash
{baseDir}/scripts/peer-openclaw-admin.sh status
```

### Estado de OpenClaw
```bash
{baseDir}/scripts/peer-openclaw-admin.sh openclaw-status
```

### Diagnóstico
```bash
{baseDir}/scripts/peer-openclaw-admin.sh doctor
```

### Auditoría de seguridad
```bash
{baseDir}/scripts/peer-openclaw-admin.sh security-audit
```

### Estado de canales
```bash
{baseDir}/scripts/peer-openclaw-admin.sh channels
```

### Logs recientes del gateway
```bash
{baseDir}/scripts/peer-openclaw-admin.sh gateway-logs
```

### Reiniciar el gateway
Requiere confirmación explícita:
```bash
{baseDir}/scripts/peer-openclaw-admin.sh gateway-restart
```

### Simular actualización
```bash
{baseDir}/scripts/peer-openclaw-admin.sh update-dry-run
```

### Actualizar OpenClaw
Requiere confirmación explícita:
```bash
{baseDir}/scripts/peer-openclaw-admin.sh update
```

### Reiniciar el servidor remoto
Requiere confirmación explícita:
```bash
{baseDir}/scripts/peer-openclaw-admin.sh reboot
```

## Respuesta

Resume el resultado en español con:
1. Nodo remoto y conectividad.
2. Estado de OpenClaw y gateway.
3. Recursos: carga, RAM, swap y disco.
4. Servicios fallidos.
5. Incidencias y siguiente acción recomendada.

No presentes como error que Tailscale use DERP; indícalo como conexión indirecta con mayor latencia.
