# Memoria replicable — Sistema de programación académica con IA FACGOB v1B

## Propósito

Crear un repositorio independiente para una página GitHub Pages que permita cargar Exceles de programación académica, interpretar reglas en prosa mediante Gemini vía Apps Script, generar una propuesta inicial y mostrar alertas.

## Arquitectura v1B

```text
GitHub Pages = interfaz y motor local
Apps Script = puente seguro con Gemini
Gemini = interpreta reglas en prosa
Motor propio = asigna cursos/secciones a bloques y salas
Outputs = programación y alertas descargables
```

## Decisión central

La IA no optimiza sola. La IA interpreta reglas. El motor propio ejecuta una asignación verificable y genera alertas.

## Inputs

- oferta.xlsx
- disponibilidad_docente.xlsx
- salas.xlsx
- bloques.xlsx
- demanda.xlsx
- restricciones.xlsx
- reglas en prosa escritas en la página

## Outputs

- programación sugerida en tabla y CSV
- alertas duras y blandas en tabla y CSV
- decisiones pendientes

## Límites del MVP

- No actualiza Google Sheets.
- No guarda historial.
- No resuelve todas las combinaciones posibles; usa un algoritmo greedy inicial.
- No reemplaza validación humana ni decisión académica.

## Etapa siguiente

Después de validar el prototipo, se puede agregar Google Sheets maestro para trazabilidad, versiones e histórico de programaciones.
