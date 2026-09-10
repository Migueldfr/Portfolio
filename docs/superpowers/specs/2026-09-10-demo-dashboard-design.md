# Diseño: Dashboard Demo Interactivo (datos simulados)

## Contexto y objetivo

El portfolio (`index.html`) tiene una sección `#projects` con tarjetas que enlazan a informes reales de Power BI de clientes (Distribución de Vinos, Farmacias, MultiÓpticas). Se quiere añadir un nuevo proyecto de demostración, genérico y sin datos reales de ningún cliente, para que cualquier visitante pueda "jugar" con un dashboard interactivo similar en espíritu a los reales (inspirado en el concepto de `pickleinc.es/dashboard`, pero con diseño propio) y así entender de forma práctica qué tipo de dashboards construye el autor.

## Alcance

Una única vista de dashboard a pantalla completa, con filtros funcionales, KPIs, gráficos y una tabla — no una réplica multi-pestaña de los dashboards reales mostrados como referencia.

## Arquitectura

- **Página nueva independiente**: `demo-dashboard.html` en la raíz del repo, junto a `index.html`. Sin backend, sin build step, coherente con el resto del sitio.
- **CSS propio**: `demo-dashboard.css` — tema oscuro estilo Power BI, no comparte estilos con `style.css` (que es el tema claro del portfolio).
- **JS propio**: `demo-dashboard.js` — vanilla JS con funciones globales, mismo estilo que `main.js` (sin módulos ES, sin frameworks).
- **Librería de gráficos**: Chart.js cargado vía CDN (jsdelivr), sin vendorizar localmente.
- **Punto de entrada**: nueva tarjeta de proyecto en `#projects` de `index.html`, con el mismo patrón HTML que las tarjetas existentes (`project-box-wrapper` > `project-box project-box2`), que abre `demo-dashboard.html` en pestaña nueva mediante un botón "Ver demo interactiva". La propia demo incluye un link "← Volver al portfolio" hacia `index.html#projects`.

## Componentes de la vista (`demo-dashboard.html`)

1. **Header**: título "Dashboard Demo — Retail", badge "Datos 100% simulados", link de vuelta al portfolio.
2. **Barra de filtros**: tres `<select>` (Mes, Año, Tienda) con opciones generadas dinámicamente desde el dataset activo, más un botón "🎲 Generar nuevo escenario".
3. **Fila de KPIs** (4 tarjetas oscuras, número grande de color): Ingresos totales, Clientes, Ticket medio, Tasa de conversión.
4. **Gráficos** (Chart.js):
   - Barras + línea: evolución mensual de clientes (nuevos vs. antiguos) con tasa de adquisición superpuesta.
   - Donut: mix de ventas por tienda.
   - Línea: evolución de ticket medio (nuevos vs. antiguos).
5. **Tabla resumen mensual**: una fila por mes con las métricas clave y una fila "Total" agregada, igual función que las tablas de los dashboards reales de referencia.

Todos los componentes reaccionan a los filtros activos y al dataset regenerado.

## Flujo de datos

- `generateDataset(seed)`: genera un dataset ficticio para 12 meses × 3-4 tiendas de ejemplo, usando un PRNG con seed (mulberry32) para que la generación sea determinista dado un seed.
- Al cargar la página y al pulsar "Generar nuevo escenario", se llama a `generateDataset(Date.now())` (nuevo seed cada vez) y se repueblan los `<select>` de filtros a partir del dataset resultante.
- Cambiar cualquier filtro (Mes/Año/Tienda) dispara `getFilteredData(dataset, filtros)`, que agrega los datos según la selección.
- El resultado agregado alimenta tres funciones de render: `renderKPIs()`, `renderCharts()` (actualiza instancias existentes de Chart.js vía `chart.data = ...; chart.update()`, sin recrear los gráficos) y `renderTable()`.
- Todo el flujo es síncrono y client-side. No hay persistencia (localStorage) ni llamadas de red más allá de cargar Chart.js — cada recarga de página genera un escenario fresco, lo cual es el comportamiento deseado.

## Manejo de errores / casos borde

- El dataset se genera siempre con todas las combinaciones válidas de mes/año/tienda, por lo que no existe un estado "filtro sin datos" que gestionar.
- Dependencia externa real: si el CDN de Chart.js no cargara, la demo no funcionaría. Se acepta este riesgo (CDN de alta disponibilidad) en vez de vendorizar la librería, para no añadir complejidad de mantenimiento a un archivo estático más en el repo.

## Testing / verificación

Este repo es un sitio estático sin test runner. La verificación es manual en navegador:
- Abrir `demo-dashboard.html` directamente y desde el link de la tarjeta en `index.html#projects`.
- Cambiar cada filtro (Mes, Año, Tienda) y confirmar que KPIs, gráficos y tabla se actualizan de forma consistente entre sí.
- Pulsar "Generar nuevo escenario" varias veces y confirmar que los números cambian y los filtros se repueblan sin romper la vista.
- Revisar el layout en viewport móvil (~400px) y de escritorio.
- Confirmar el link de vuelta al portfolio.

## Fuera de alcance

- Múltiples pestañas/vistas tipo los dashboards reales de referencia (solo una vista completa).
- Persistencia de escenario entre visitas.
- Autenticación o datos reales de cualquier cliente.
