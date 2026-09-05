# FatalityCheck — Sitio Web

Corpus longitudinal de accidentes fatales en minería EE.UU. · MSHA 30 CFR Part 50 · 1995–2026

**URL:** https://invictumspa.github.io/fatalitycheck/

## Estructura

```
fatalitycheck-web/
├── index.html          # Página principal + KPIs + gráficos
├── corpus.html         # Explorador del corpus (búsqueda + filtros)
├── statistics.html     # Estadísticas detalladas
├── bias.html           # Análisis de sesgos cognitivos MAP-v1
├── about.html          # Información del proyecto
├── 404.html            # Página de error
├── manifest.json       # PWA manifest
├── robots.txt          # SEO
├── sitemap.xml         # SEO sitemap
├── _config.yml         # GitHub Pages (Jekyll)
├── css/style.css       # Estilos globales
├── js/
│   ├── data.js         # Motor de consultas y datos
│   └── app.js          # Componentes UI y charts
├── data/
│   ├── corpus_v537.json   # Corpus completo (1,654 registros)
│   ├── summary_v537.json  # Resumen estadístico
│   └── corpus_v537.csv    # Exportación CSV
└── .github/workflows/
    └── deploy.yml      # GitHub Actions (auto-deploy)
```

## Deploy en GitHub Pages

1. Crear repositorio GitHub: `invictumspa/fatalitycheck`
2. Subir todos los archivos al branch `main`
3. Ir a: Settings → Pages → Source: Deploy from branch `main` `/` (root)
4. O bien: usar GitHub Actions (`.github/workflows/deploy.yml`)
5. URL resultante: `https://invictumspa.github.io/fatalitycheck/`

## Tecnologías

- HTML5 / CSS3 / JavaScript vanilla (sin frameworks)
- Chart.js 4.4 (CDN) para gráficos
- Sin backend — datos estáticos en JSON
- Compatible con GitHub Pages (Jekyll estático)

## Corpus S537

- 1,654 registros activos · 79 parámetros
- Cobertura 99.7% · Pearson r=0.970
- Completitud 99.9% (≥75/79 campos)
- total_errors: 0

**Invictum SPA · Copiapó, Chile · 2026**
