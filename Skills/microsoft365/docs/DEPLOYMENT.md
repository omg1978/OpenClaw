# Despliegue – Microsoft 365 Skill

## Resumen

| Campo | Valor |
|---|---|
| Fecha de despliegue | 2026-07-15 |
| Servidor | firebat (Linux Debian) |
| OpenClaw | v2026.7.1 |
| Ruta | ~/skills/microsoft365/ |
| Cuenta Microsoft | admin@oscarmartin.org |
| Tenant | de0f1f4f-bc2b-476c-bd6e-738d58015788 |
| Puerto callback | 18790 |
| Estado | ✅ Operativo |

## Checklist post-despliegue

- [x] npm install completado
- [x] .env configurado con credenciales
- [x] Autenticación OAuth2 exitosa
- [x] Email list funciona
- [x] Calendar today funciona
- [x] SKILL.md presente para detección por OpenClaw
- [x] Tokens almacenados en ~/.openclaw/microsoft365-tokens.json

## Mantenimiento

### Renovar autenticación (cada ~90 días o si falla)

```bash
# Windows: abrir túnel
ssh -L 18790:localhost:18790 oscar@openclaw-firebat

# Linux:
cd ~/skills/microsoft365 && npm run auth
```

### Actualizar el skill

```powershell
# Windows: comprimir y enviar
cd Skills/microsoft365
tar -czf "$env:TEMP\microsoft365-skill.tar.gz" --exclude=node_modules *
scp -i "$env:USERPROFILE\.ssh\openclaw_firebat" "$env:TEMP\microsoft365-skill.tar.gz" oscar@openclaw-firebat:/home/oscar/

# Linux: extraer
cd ~/skills/microsoft365
tar -xzf ~/microsoft365-skill.tar.gz
npm install
rm ~/microsoft365-skill.tar.gz
```

### Renovar Client Secret (cada 24 meses)

1. Azure Portal → App registration → Certificates & secrets
2. Crear nuevo secreto
3. Actualizar `MS_CLIENT_SECRET` en `~/skills/microsoft365/.env`
4. Re-autenticar: `npm run auth`
