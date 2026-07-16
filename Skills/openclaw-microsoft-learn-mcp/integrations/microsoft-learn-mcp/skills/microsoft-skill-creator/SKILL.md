---
name: microsoft-skill-creator
description: Crea nuevas skills de OpenClaw especializadas en tecnologías Microsoft usando Microsoft Learn MCP como fuente oficial.
metadata:
  openclaw:
    requires:
      bins:
        - mcporter
    os:
      - linux
---

# Microsoft Skill Creator

Usa esta skill para diseñar nuevas skills especializadas en productos o tecnologías Microsoft basándose en Microsoft Learn.

Servidor MCP:

```text
mcp-microsoft-learn
```

## Herramientas

```bash
mcporter call \
  'mcp-microsoft-learn.microsoft_docs_search(query: "CONSULTA")' \
  --output markdown \
  --timeout 120000
```

```bash
mcporter call \
  'mcp-microsoft-learn.microsoft_docs_fetch(url: "URL_MICROSOFT_LEARN")' \
  --output markdown \
  --timeout 120000
```

```bash
mcporter call \
  'mcp-microsoft-learn.microsoft_code_sample_search(query: "CONSULTA", language: "LENGUAJE")' \
  --output markdown \
  --timeout 120000
```

## Flujo de creación

1. Define propósito y alcance.
2. Identifica producto, versión y plataforma.
3. Busca documentación oficial.
4. Recupera páginas completas.
5. Busca ejemplos oficiales si genera código.
6. Diseña instrucciones operativas.
7. Añade seguridad y confirmaciones.
8. Declara dependencias reales.
9. Guarda bajo `~/skills/NOMBRE-SKILL/SKILL.md`.
10. Valida con OpenClaw.

## Reglas

- Una skill debe tener un propósito concreto.
- No dupliques MCPorter.
- Reutiliza `mcp-microsoft-learn`.
- Prioriza documentación oficial.
- No incluyas secretos.
- Exige confirmación para acciones destructivas.
- No copies contenido extenso de Microsoft Learn.

## Salida esperada

Entrega:

1. nombre;
2. propósito;
3. estructura;
4. `SKILL.md`;
5. dependencias;
6. instalación;
7. validación;
8. pruebas;
9. riesgos y controles.
