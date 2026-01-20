# Tailwind CSS v4 - Deno-Only Setup

This project uses **Tailwind CSS v4** compiled entirely with **Deno** - no Node.js installation required!

## How It Works

Deno's npm compatibility feature allows us to run npm packages directly:

```bash
deno run -A npm:postcss-cli@11 ...
```

This downloads and caches the npm packages in Deno's cache, then runs them.

## Configuration Files

- **`deno.json`** - Contains build tasks and enables `nodeModulesDir: "auto"`
- **`postcss.config.js`** - PostCSS configuration (ESM format for Deno)
- **`nodes/styles/tailwind.css`** - Source CSS with `@theme` directive
- **`nodes/styles/ui.css`** - Compiled output (gitignored)

## Commands

```bash
# Build CSS once
deno task build:css

# Watch for changes and rebuild automatically
deno task watch:css

# Start dev server
deno task dev
```

## Custom Theme

Defined in `nodes/styles/tailwind.css` using the `@theme` directive:

- **Graphite colors**: 50, 75, 100, 200, 300, 400, 500, 600
- **Primary**: #00d1d1
- **Green**: #18e09a
- **Red**: #f95741
- **Font**: Inter, sans-serif

## Benefits of Deno-Only Approach

✅ No `package.json` or `package-lock.json` to maintain  
✅ No `node_modules` directory (Deno caches packages globally)  
✅ Faster installation (packages are cached)  
✅ Single runtime for the entire project  
✅ Better security with explicit permissions

## First-Time Setup

When you first run `deno task build:css`, Deno will:

1. Download the required npm packages
2. Cache them in `~/.cache/deno/npm/`
3. Create a local `node_modules` directory (for compatibility)
4. Compile your CSS

Subsequent runs will be much faster as packages are cached.
