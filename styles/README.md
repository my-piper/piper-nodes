# Tailwind CSS Setup

This directory contains the Tailwind CSS configuration and compiled output for the piper-nodes project.

## Files

- `tailwind.css` - Source CSS file with Tailwind directives and custom theme configuration
- `ui.css` - Compiled CSS file (generated, do not edit directly)

## Custom Theme

The custom theme includes:

### Colors

- **Graphite palette**: 50, 75, 100, 200, 300, 400, 500, 600
- **Primary**: #00d1d1 (cyan)
- **Green**: #18e09a
- **Red**: #f95741

### Fonts

- **Sans**: Inter, sans-serif

## Building CSS

To build the CSS after making changes to `tailwind.css`:

```bash
deno task build:css
```

## Watch Mode

To automatically rebuild CSS when changes are detected:

```bash
deno task watch:css
```

## Usage in HTML

Include the compiled CSS in your HTML files:

```html
<!-- From nodes/*/app.html -->
<link rel="stylesheet" href="../../../styles/ui.css" />
```

## Tailwind Version

This project uses **Tailwind CSS v4** which uses CSS-first configuration via the `@theme` directive instead of a JavaScript config file.

## Deno-Only Setup

This project uses **Deno exclusively** - no Node.js required! The CSS compilation is done using:

- `deno run npm:postcss-cli` - Runs PostCSS CLI via Deno's npm compatibility
- `npm:@tailwindcss/postcss` - Tailwind CSS v4 PostCSS plugin
- `npm:autoprefixer` - Autoprefixer for vendor prefixes

The `nodeModulesDir: "auto"` setting in `deno.json` enables Deno to cache npm packages locally for better performance.
