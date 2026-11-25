# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Biome rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Linting and formatting

This project uses [Biome](https://biomejs.dev) for both linting and formatting. The configuration lives in `biome.json`.

```bash
pnpm lint       # biome check (lint + format check + import order)
pnpm lint:fix   # biome check --write (apply safe fixes)
pnpm format     # biome format --write .
```

See the [Biome documentation](https://biomejs.dev/docs/) for the full rule list and configuration options.
