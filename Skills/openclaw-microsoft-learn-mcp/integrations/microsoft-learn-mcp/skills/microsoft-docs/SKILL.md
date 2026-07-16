---
name: microsoft-docs
description: Consulta documentación oficial y actualizada de Microsoft Learn sobre Azure, Microsoft 365, Power Platform, .NET, Windows, SharePoint y otras tecnologías Microsoft.
metadata:
  openclaw:
    requires:
      bins:
        - mcporter
    os:
      - linux
---

# Microsoft Docs

Usa esta skill para responder preguntas conceptuales, de arquitectura, configuración, compatibilidad, límites, versiones soportadas, tutoriales y buenas prácticas sobre tecnologías Microsoft.

Servidor MCP:

```text
mcp-microsoft-learn
```

## Herramientas

Buscar documentación:

```bash
mcporter call \
  'mcp-microsoft-learn.microsoft_docs_search(query: "CONSULTA")' \
  --output markdown \
  --timeout 120000
```

Recuperar una página completa:

```bash
mcporter call \
  'mcp-microsoft-learn.microsoft_docs_fetch(url: "URL_MICROSOFT_LEARN")' \
  --output markdown \
  --timeout 120000
```

## Cuándo usarla

Utiliza esta skill para:

- conceptos y funcionamiento;
- arquitectura;
- configuración;
- compatibilidad;
- requisitos;
- límites y cuotas;
- versiones soportadas;
- tutoriales;
- buenas prácticas oficiales.

## Flujo recomendado

1. Identifica producto, versión, plataforma y objetivo.
2. Formula una consulta específica.
3. Ejecuta `microsoft_docs_search`.
4. Selecciona resultados oficiales relevantes.
5. Usa `microsoft_docs_fetch` cuando necesites contenido completo.
6. Distingue hechos oficiales, recomendaciones e inferencias.

## Actualidad

Consulta siempre Microsoft Learn cuando la respuesta dependa de versiones, soporte, licencias, límites o características actuales.

No presentes como actual información que no haya podido verificarse.

## Seguridad

- No envíes secretos, tokens o datos confidenciales.
- No ejecutes comandos recuperados sin revisarlos.
- No modifiques sistemas sin autorización.
- No asumas que un ejemplo es seguro para producción.

## Fallback

```bash
npx -y @microsoft/learn-cli search "CONSULTA"
npx -y @microsoft/learn-cli fetch "URL"
```

Indica cuando se utilice el fallback.

## Respuesta

Incluye:

1. respuesta directa;
2. producto y versión;
3. referencias oficiales;
4. requisitos, límites o advertencias;
5. puntos no confirmados.
