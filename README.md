# FACGOB — Programación Académica con IA

Prototipo v1B para generar una programación académica sugerida a partir de archivos Excel, reglas en prosa e interpretación IA mediante Apps Script + Gemini.

## Objetivo

Permitir que una persona usuaria cargue insumos de programación académica en formato Excel, escriba reglas en prosa, y obtenga:

- programación sugerida;
- alertas duras;
- alertas blandas;
- cursos/secciones no asignadas;
- decisiones pendientes;
- archivos CSV descargables.

## Arquitectura v1B

```text
GitHub Pages
  ├─ recibe Exceles
  ├─ valida columnas mínimas
  ├─ envía reglas en prosa a Apps Script
  ├─ recibe reglas estructuradas desde Gemini
  ├─ ejecuta motor propio de programación
  └─ muestra y exporta resultados

Apps Script
  ├─ actúa como backend liviano
  ├─ guarda API key con PropertiesService
  ├─ llama a Gemini API
  └─ devuelve JSON estructurado
```

En esta versión no se actualiza un Google Sheet maestro. La página trabaja con los Excel cargados en el navegador. Apps Script sólo se usa como puente seguro para la IA.

## Archivos de entrada esperados

Todos los archivos pueden ser `.xlsx`, `.xls` o `.csv`. Para Excel se usa la primera hoja del archivo.

### 1. `oferta.xlsx`

Columnas mínimas:

```text
carrera,codigo,ramo,semestre_malla,tipo,secciones_requeridas,cupo_estimado,requiere_pc,profesor_sugerido,prioridad
```

### 2. `disponibilidad_docente.xlsx`

```text
profesor,dia,bloque,disponibilidad,observacion
```

Valores esperados en `disponibilidad`:

```text
Disponible,No disponible,Preferente,Dudoso
```

### 3. `salas.xlsx`

```text
sala,capacidad,tipo,disponible
```

Valores esperados en `tipo`:

```text
Normal,LAB,Auditorio
```

### 4. `bloques.xlsx`

```text
dia,bloque,inicio,termino
```

### 5. `demanda.xlsx`

```text
carrera,codigo,ramo,estimacion_2026,secciones_sugeridas,metodo_estimacion
```

### 6. `restricciones.xlsx`

```text
tipo_restriccion,elemento,restriccion,dureza,prioridad
```

## Reglas en prosa

La persona usuaria puede escribir reglas como:

```text
Los cursos de inglés deben ir idealmente en el primer bloque de la mañana.
No usar laboratorios para cursos que no requieren computador.
Los electivos no deben topar entre sí si es posible.
No programar clases después de las 18:00.
```

La IA debe devolver reglas estructuradas en JSON. El motor propio usa esas reglas como complemento, pero no delega la optimización completa en la IA.

## Instalación en GitHub Pages

1. Crear un repositorio nuevo en GitHub, por ejemplo:

```text
facgob-programacion-academica-ia
```

2. Subir todos los archivos de esta carpeta al repositorio.
3. Ir a `Settings > Pages`.
4. Seleccionar:

```text
Source: Deploy from a branch
Branch: main
Folder: /root
```

5. Esperar la URL pública de GitHub Pages.

## Configuración de Apps Script

1. Entrar a `script.google.com` con la cuenta institucional.
2. Crear un proyecto standalone.
3. Pegar el contenido de `backend/apps_script_backend.js`.
4. Guardar la API key de Gemini en `Project Settings > Script properties`:

```text
GEMINI_API_KEY = tu_api_key
```

5. Implementar como Web App:

```text
Deploy > New deployment > Web app
Execute as: Me
Who has access: Anyone with the link
```

6. Copiar la URL de la Web App y pegarla en la página.

## Seguridad

- No guardar API keys en `index.html`, `app.js` ni en GitHub.
- Guardar secretos sólo en Apps Script `PropertiesService`.
- No subir datos sensibles a repositorios públicos sin autorización.
- El tablero no debe considerarse fuente de verdad; en v1B es una herramienta de apoyo.

## Estado del prototipo

Este repositorio contiene:

- interfaz base;
- lectura de Excel/CSV;
- validación de columnas;
- conexión opcional con Apps Script/Gemini;
- motor greedy inicial de asignación;
- generación de alertas;
- exportación CSV.

No contiene todavía:

- autenticación;
- Google Sheet maestro;
- historial de versiones;
- optimizador matemático avanzado;
- integración con Ucampus.

## Ruta recomendada

```text
v1B: Exceles + IA interpreta reglas + motor local + descarga resultados.
v2: guardar resultados en Google Sheet maestro.
v3: historial, versiones, trazabilidad y permisos.
v4: optimización avanzada y comparación de escenarios.
```


## Nota sobre creación del repositorio

El repositorio recomendado es independiente del sitio actual de Secretaría de Estudios:

```text
raulrojastaborga-conejo/facgob-programacion-academica-ia
```

Si se crea en GitHub con README inicial, estos archivos pueden cargarse directamente a la rama `main`.
