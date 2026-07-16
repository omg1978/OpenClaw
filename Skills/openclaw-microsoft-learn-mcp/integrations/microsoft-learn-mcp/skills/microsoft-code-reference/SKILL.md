---
name: microsoft-code-reference
description: Verifica APIs, SDK, paquetes, firmas y ejemplos de código Microsoft usando documentación oficial y muestras de Microsoft Learn.
metadata:
  openclaw:
    requires:
      bins:
        - mcporter
    os:
      - linux
---

# Microsoft Code Reference

Usa esta skill para escribir, revisar o corregir código relacionado con SDK, APIs, bibliotecas y servicios Microsoft.

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
  'mcp-microsoft-learn.microsoft_code_sample_search(query: "CONSULTA", language: "LENGUAJE")' \
  --output markdown \
  --timeout 120000
```

```bash
mcporter call \
  'mcp-microsoft-learn.microsoft_docs_fetch(url: "URL_MICROSOFT_LEARN")' \
  --output markdown \
  --timeout 120000
```

## Cuándo usarla

- verificar clases o métodos;
- confirmar firmas u overloads;
- localizar paquetes;
- buscar ejemplos oficiales;
- resolver errores;
- detectar APIs obsoletas;
- comparar versiones de SDK.

## Flujo

1. Identifica lenguaje, SDK, versión y paquete.
2. Busca la clase, método o error.
3. Recupera la página completa si necesitas parámetros.
4. Busca un ejemplo oficial.
5. Compara con el código del usuario.
6. Genera código usando APIs verificadas.

## Seguridad

- No inventes métodos, firmas ni paquetes.
- No incluyas secretos.
- No desactives TLS.
- No ejecutes código destructivo sin confirmación.
- Señala permisos mínimos y riesgos.

## Fallback

```bash
npx -y @microsoft/learn-cli search "CONSULTA"
npx -y @microsoft/learn-cli code-search "CONSULTA" --language LENGUAJE
npx -y @microsoft/learn-cli fetch "URL"
```

## Respuesta

Incluye:

1. API verificada;
2. paquete y versión;
3. código;
4. referencia oficial;
5. riesgos y permisos;
6. diferencias con el código original.
