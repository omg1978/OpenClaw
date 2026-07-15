---
name: microsoft365
description: Gestiona email y calendario de Microsoft 365 mediante Microsoft Graph API. Lee, envía y busca emails; consulta, crea eventos de calendario y verifica disponibilidad.
metadata:
  openclaw:
    requires:
      bins:
        - node
        - npm
    os:
      - linux
---

# Microsoft 365 Skill

Usa este skill cuando el usuario pida leer, enviar o buscar emails, consultar su calendario, crear eventos o verificar disponibilidad de asistentes en Microsoft 365 / Outlook.

## Modelo operativo

- Requiere autenticación previa con `npm run auth` en `{baseDir}`.
- Los tokens se almacenan cifrados en `~/.openclaw/microsoft365-tokens.json`.
- Se refresca automáticamente el access token cuando expira.
- No muestres tokens, secretos ni el contenido del archivo `.env`.
- Para acciones que envían email (`email send`, `email reply`), muestra al usuario un borrador y pide confirmación antes de enviar.

## Requisitos

1. Node.js >= 18
2. Archivo `{baseDir}/.env` configurado con credenciales de Azure AD
3. Autenticación completada (`cd {baseDir} && npm run auth`)

## Acciones permitidas

### Listar emails del inbox
```bash
cd {baseDir} && npx tsx src/index.ts email list --top 10
```

### Listar emails no leídos
```bash
cd {baseDir} && npx tsx src/index.ts email list --unread
```

### Leer un email específico
```bash
cd {baseDir} && npx tsx src/index.ts email read MESSAGE_ID
```

### Enviar email
Requiere confirmación explícita:
```bash
cd {baseDir} && npx tsx src/index.ts email send --to "destinatario@email.com" --subject "Asunto" --body "Contenido"
```

### Crear borrador
```bash
cd {baseDir} && npx tsx src/index.ts email draft --to "destinatario@email.com" --subject "Asunto" --body "Contenido"
```

### Buscar emails
```bash
cd {baseDir} && npx tsx src/index.ts email search "término de búsqueda"
```

### Responder a un email
Requiere confirmación explícita:
```bash
cd {baseDir} && npx tsx src/index.ts email reply MESSAGE_ID --body "Respuesta"
```

### Ver eventos de hoy
```bash
cd {baseDir} && npx tsx src/index.ts calendar today
```

### Ver eventos de la semana
```bash
cd {baseDir} && npx tsx src/index.ts calendar week
```

### Ver detalles de un evento
```bash
cd {baseDir} && npx tsx src/index.ts calendar show EVENT_ID
```

### Crear evento en calendario
Requiere confirmación explícita:
```bash
cd {baseDir} && npx tsx src/index.ts calendar create --subject "Reunión" --start "2026-07-20T10:00:00" --end "2026-07-20T11:00:00" --attendees "user@email.com" --location "Sala A"
```

### Consultar disponibilidad
```bash
cd {baseDir} && npx tsx src/index.ts calendar availability --start "2026-07-20T09:00:00" --end "2026-07-20T18:00:00" --attendees "user@email.com"
```

## Respuesta

Resume los resultados en español con formato claro:
1. Para emails: remitente, asunto, fecha y vista previa.
2. Para calendario: hora, asunto, ubicación y asistentes.
3. Indica claramente cuántos mensajes/eventos hay.
4. Si hay error de autenticación, sugiere ejecutar `npm run auth` de nuevo.
