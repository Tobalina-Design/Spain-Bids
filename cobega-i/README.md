# Cobega I · Propuesta para PATRIZIA

Web de la propuesta con un reloj en 3D (Three.js) que se despieza con el scroll (Lenis).

## Desarrollo

```bash
pnpm install
pnpm dev
```

## Publicación

Cada push a `main` compila y publica en GitHub Pages mediante `.github/workflows/deploy.yml`.
En *Settings → Pages*, la fuente debe ser **GitHub Actions**.

## Dónde editar

- Textos: `src/content.ts`
- Reloj (geometría y materiales): `src/scene/Watch.ts`
- Posiciones del reloj por sección: `src/engine.ts`
- Estilos: `src/index.css`
