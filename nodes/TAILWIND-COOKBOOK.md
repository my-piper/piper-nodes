# Tailwind CSS Cookbook for Piper Nodes

A practical guide with copy-paste examples for building consistent UIs across all piper-nodes apps.

> 💡 **See it in action:** Check out [open_router/ask_any_llm/app.html](./open_router/ask_any_llm/app.html) for a complete working example.

## 📖 Table of Contents

- [Quick Start](#-quick-start) - Setup instructions
- [Common Components](#-common-components) - Buttons, inputs, tables, badges, etc.
- [Layout Patterns](#-layout-patterns) - Full-screen, sidebar, two-column layouts
- [Color Usage Guide](#-color-usage-guide) - Text, background, and border colors
- [Best Practices](#-best-practices) - Spacing, transitions, accessibility
- [Common Patterns](#-common-patterns) - Search + table, form + actions
- [Reference](#-reference) - Complete color palette and sizes
- [Migration Checklist](#-migration-checklist) - Converting from Pico CSS

## 🚀 Quick Start

### Setup Flow

```
1. Load tailwind.config.js (common theme)
   ↓
2. Load Tailwind CSS from CDN
   ↓
3. Apply config to Tailwind
   ↓
4. Use Tailwind classes in your HTML
```

### 1. Setup (Copy to your HTML `<head>`)

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Your App Name</title>

    <!-- Tailwind CSS with common config -->
    <script src="../../tailwind.config.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      if (window.tailwindConfig) {
        tailwind.config = window.tailwindConfig;
      }
    </script>

    <!-- Vue.js (if needed) -->
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>

    <!-- Fonts -->
    <style>
      @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
    </style>
  </head>
  <body class="bg-graphite-600 text-white font-sans text-sm antialiased">
    <!-- Your app content -->
  </body>
</html>
```

## 🎨 Common Components

### Page Container

```html
<!-- Full-height container with padding -->
<div class="flex flex-col gap-2 p-2 h-screen">
  <!-- Your content -->
</div>
```

### Search Input

```html
<input
  type="text"
  placeholder="Search..."
  class="w-full px-3 py-2 bg-graphite-500 text-white border border-graphite-200 rounded-md focus:bg-graphite-400 focus:border-graphite-100 focus:outline-none transition-colors"
/>
```

### Text Input

```html
<input
  type="text"
  placeholder="Enter text..."
  class="w-full px-3 py-2 bg-graphite-500 text-white border border-graphite-200 rounded-md focus:bg-graphite-400 focus:border-graphite-100 focus:outline-none transition-colors"
/>
```

### Textarea

```html
<textarea
  placeholder="Enter description..."
  rows="4"
  class="w-full px-3 py-2 bg-graphite-500 text-white border border-graphite-200 rounded-md focus:bg-graphite-400 focus:border-graphite-100 focus:outline-none transition-colors resize-vertical"
></textarea>
```

### Select Dropdown

```html
<select
  class="w-full px-3 py-2 bg-graphite-500 text-white border border-graphite-200 rounded-md focus:bg-graphite-400 focus:border-graphite-100 focus:outline-none cursor-pointer"
>
  <option value="">Select option...</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

### Primary Button

```html
<button
  class="px-4 py-2 bg-graphite-400 text-graphite-50 border border-graphite-200 rounded font-bold hover:bg-graphite-300 hover:border-graphite-75 hover:text-white hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all cursor-pointer"
>
  Click Me
</button>
```

### Secondary Button

```html
<button
  class="px-4 py-2 bg-graphite-500 text-graphite-75 border border-graphite-300 rounded hover:bg-graphite-400 hover:text-white transition-colors"
>
  Cancel
</button>
```

### Success Button

```html
<button
  class="px-4 py-2 bg-green text-graphite-600 rounded font-bold hover:bg-green/90 transition-colors"
>
  Save
</button>
```

### Danger Button

```html
<button
  class="px-4 py-2 bg-red text-white rounded font-bold hover:bg-red/90 transition-colors"
>
  Delete
</button>
```

### Badge (Success)

```html
<span
  class="inline-block px-2 py-0.5 bg-green text-graphite-500 rounded text-xs font-bold"
>
  Active
</span>
```

### Badge (Neutral)

```html
<span
  class="inline-block px-2 py-0.5 bg-graphite-300 text-graphite-75 rounded text-xs font-bold"
>
  Inactive
</span>
```

### Badge (Error)

```html
<span
  class="inline-block px-2 py-0.5 bg-red text-white rounded text-xs font-bold"
>
  Error
</span>
```

### Card

```html
<div class="bg-graphite-500 border border-graphite-200 rounded-lg p-4">
  <h3 class="text-lg font-bold mb-2">Card Title</h3>
  <p class="text-graphite-75">Card content goes here...</p>
</div>
```

### Table

```html
<div class="flex-1 overflow-auto">
  <table class="w-full border-collapse">
    <thead>
      <tr>
        <th
          class="bg-graphite-400 text-white p-2 border-b-2 border-graphite-200 sticky top-0 z-10 text-left"
        >
          Column 1
        </th>
        <th
          class="bg-graphite-400 text-white p-2 border-b-2 border-graphite-200 sticky top-0 z-10 text-left"
        >
          Column 2
        </th>
      </tr>
    </thead>
    <tbody>
      <tr class="hover:bg-graphite-200 transition-colors">
        <td class="p-2 border-b border-graphite-300">Data 1</td>
        <td class="p-2 border-b border-graphite-300">Data 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Sortable Table Header

```html
<th
  @click="sortBy('name')"
  class="bg-graphite-400 text-white p-2 border-b-2 border-graphite-200 sticky top-0 z-10 cursor-pointer select-none hover:bg-graphite-300 text-left"
>
  Column Name
  <span
    v-if="sortKey === 'name'"
    class="inline-block ml-1 text-[10px] opacity-50"
  >
    {{ sortOrder === 'asc' ? '▲' : '▼' }}
  </span>
</th>
```

### Grid Layout

```html
<!-- 3-column grid -->
<div class="grid grid-cols-3 gap-2">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>

<!-- Responsive grid (auto-fill) -->
<div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### Loading Spinner

```html
<div class="flex items-center justify-center py-8">
  <div
    class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
  ></div>
</div>
```

### Empty State

```html
<div class="text-center py-8 text-graphite-75">
  <p>No items found</p>
</div>
```

### Alert / Message Box

```html
<!-- Info -->
<div class="bg-graphite-500 border border-graphite-200 rounded p-3 text-sm">
  <strong>Info:</strong> This is an informational message.
</div>

<!-- Success -->
<div class="bg-green/10 border border-green rounded p-3 text-sm text-green">
  <strong>Success:</strong> Operation completed successfully.
</div>

<!-- Error -->
<div class="bg-red/10 border border-red rounded p-3 text-sm text-red">
  <strong>Error:</strong> Something went wrong.
</div>
```

### Modal/Dialog Overlay

```html
<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
  <div
    class="bg-graphite-500 border border-graphite-200 rounded-lg p-6 max-w-md w-full mx-4"
  >
    <h2 class="text-xl font-bold mb-4">Modal Title</h2>
    <p class="text-graphite-75 mb-4">Modal content goes here...</p>
    <div class="flex gap-2 justify-end">
      <button
        class="px-4 py-2 bg-graphite-400 text-white rounded hover:bg-graphite-300"
      >
        Cancel
      </button>
      <button
        class="px-4 py-2 bg-primary text-graphite-600 rounded font-bold hover:bg-primary/90"
      >
        Confirm
      </button>
    </div>
  </div>
</div>
```

### Form Group

```html
<div class="space-y-4">
  <div>
    <label class="block text-sm font-medium mb-1">Label</label>
    <input
      type="text"
      class="w-full px-3 py-2 bg-graphite-500 text-white border border-graphite-200 rounded-md focus:bg-graphite-400 focus:border-graphite-100 focus:outline-none"
    />
    <p class="text-xs text-graphite-75 mt-1">Helper text goes here</p>
  </div>
</div>
```

### Checkbox

```html
<label class="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    class="w-4 h-4 rounded border-graphite-200 bg-graphite-500 text-primary focus:ring-primary focus:ring-offset-0"
  />
  <span>Checkbox label</span>
</label>
```

### Radio Button

```html
<label class="flex items-center gap-2 cursor-pointer">
  <input
    type="radio"
    name="option"
    class="w-4 h-4 border-graphite-200 bg-graphite-500 text-primary focus:ring-primary focus:ring-offset-0"
  />
  <span>Radio option</span>
</label>
```

### Tabs

```html
<div>
  <div class="flex border-b border-graphite-300">
    <button
      class="px-4 py-2 border-b-2 border-primary text-primary font-medium"
    >
      Tab 1
    </button>
    <button
      class="px-4 py-2 border-b-2 border-transparent text-graphite-75 hover:text-white"
    >
      Tab 2
    </button>
    <button
      class="px-4 py-2 border-b-2 border-transparent text-graphite-75 hover:text-white"
    >
      Tab 3
    </button>
  </div>
  <div class="p-4">Tab content goes here</div>
</div>
```

## 🎯 Layout Patterns

### Full-Screen App Layout

```html
<div class="flex flex-col h-screen bg-graphite-600 text-white">
  <!-- Header -->
  <header class="border-b border-graphite-300 p-4">
    <h1 class="text-xl font-bold">App Title</h1>
  </header>

  <!-- Main Content -->
  <main class="flex-1 overflow-auto p-4">
    <!-- Your content -->
  </main>

  <!-- Footer (optional) -->
  <footer class="border-t border-graphite-300 p-4 text-sm text-graphite-75">
    Footer content
  </footer>
</div>
```

### Sidebar Layout

```html
<div class="flex h-screen bg-graphite-600 text-white">
  <!-- Sidebar -->
  <aside class="w-64 border-r border-graphite-300 p-4 overflow-auto">
    <nav class="space-y-2">
      <a
        href="#"
        class="block px-3 py-2 rounded bg-graphite-400 hover:bg-graphite-300"
      >
        Menu Item 1
      </a>
      <a href="#" class="block px-3 py-2 rounded hover:bg-graphite-400">
        Menu Item 2
      </a>
    </nav>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 overflow-auto p-4">
    <!-- Your content -->
  </main>
</div>
```

### Two-Column Layout

```html
<div class="grid grid-cols-2 gap-4 h-screen p-4 bg-graphite-600">
  <div class="overflow-auto">
    <!-- Left column -->
  </div>
  <div class="overflow-auto">
    <!-- Right column -->
  </div>
</div>
```

## 🎨 Color Usage Guide

### Text Colors

```html
<!-- Primary text -->
<p class="text-white">Primary text</p>

<!-- Secondary/muted text -->
<p class="text-graphite-75">Secondary text</p>

<!-- Disabled text -->
<p class="text-graphite-100 opacity-50">Disabled text</p>

<!-- Accent colors -->
<p class="text-primary">Primary accent</p>
<p class="text-green">Success text</p>
<p class="text-red">Error text</p>
```

### Background Colors

```html
<!-- Page background -->
<div class="bg-graphite-600">Page</div>

<!-- Card/panel background -->
<div class="bg-graphite-500">Card</div>

<!-- Button background -->
<div class="bg-graphite-400">Button</div>

<!-- Hover state -->
<div class="bg-graphite-300">Hover</div>

<!-- Accent backgrounds -->
<div class="bg-primary">Primary</div>
<div class="bg-green">Success</div>
<div class="bg-red">Error</div>
```

### Border Colors

```html
<!-- Default border -->
<div class="border border-graphite-200">Default</div>

<!-- Subtle border -->
<div class="border border-graphite-300">Subtle</div>

<!-- Focus border -->
<div class="border border-graphite-100">Focus</div>

<!-- Accent borders -->
<div class="border border-primary">Primary</div>
<div class="border border-green">Success</div>
<div class="border border-red">Error</div>
```

## 💡 Best Practices

### 1. Consistent Spacing

Use the spacing scale consistently:

- `gap-2` (8px) - Default gap between elements
- `p-2` (8px) - Default padding
- `p-4` (16px) - Larger padding for cards/sections
- `space-y-4` - Vertical spacing between form elements

### 2. Transitions

Add smooth transitions for interactive elements:

```html
<button class="transition-colors hover:bg-graphite-300">Button</button>
<div class="transition-all hover:-translate-y-0.5">Card</div>
```

### 3. Focus States

Always include focus states for accessibility:

```html
<input
  class="focus:bg-graphite-400 focus:border-graphite-100 focus:outline-none"
/>
```

### 4. Responsive Design

Use responsive utilities when needed:

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
  <!-- Responsive grid -->
</div>
```

### 5. Dark Theme Consistency

Always use the graphite color scale for dark theme consistency:

- ✅ `bg-graphite-600` for page backgrounds
- ✅ `bg-graphite-500` for cards/inputs
- ✅ `bg-graphite-400` for buttons
- ❌ Avoid using arbitrary colors like `bg-gray-800`

## 🔧 Common Patterns

### Search + Table Pattern

```html
<div class="flex flex-col gap-2 p-2 h-screen">
  <!-- Search -->
  <div class="mb-2">
    <input
      type="text"
      placeholder="Search..."
      class="w-full px-3 py-2 bg-graphite-500 text-white border border-graphite-200 rounded-md focus:bg-graphite-400 focus:border-graphite-100 focus:outline-none"
    />
  </div>

  <!-- Table -->
  <div class="flex-1 overflow-auto">
    <table class="w-full border-collapse">
      <!-- Table content -->
    </table>
  </div>
</div>
```

### Form + Actions Pattern

```html
<div class="max-w-2xl mx-auto p-4">
  <form class="space-y-4">
    <!-- Form fields -->
    <div>
      <label class="block text-sm font-medium mb-1">Field Label</label>
      <input
        type="text"
        class="w-full px-3 py-2 bg-graphite-500 text-white border border-graphite-200 rounded-md focus:bg-graphite-400 focus:border-graphite-100 focus:outline-none"
      />
    </div>

    <!-- Actions -->
    <div class="flex gap-2 justify-end pt-4 border-t border-graphite-300">
      <button
        type="button"
        class="px-4 py-2 bg-graphite-500 text-graphite-75 border border-graphite-300 rounded hover:bg-graphite-400 hover:text-white"
      >
        Cancel
      </button>
      <button
        type="submit"
        class="px-4 py-2 bg-primary text-graphite-600 rounded font-bold hover:bg-primary/90"
      >
        Save
      </button>
    </div>
  </form>
</div>
```

## 📚 Reference

### Complete Color Palette

| Class          | Hex     | Usage                             |
| -------------- | ------- | --------------------------------- |
| `graphite-50`  | #eaeaea | Light text, active borders        |
| `graphite-75`  | #aaaaaa | Muted/secondary text              |
| `graphite-100` | #878787 | Tertiary text, focus borders      |
| `graphite-200` | #535353 | Default borders, dividers         |
| `graphite-300` | #303030 | Subtle borders, hover states      |
| `graphite-400` | #222222 | Buttons, active elements          |
| `graphite-500` | #1d1d1d | Cards, inputs, panels             |
| `graphite-600` | #111111 | Page background                   |
| `primary`      | #00d1d1 | Primary actions, links            |
| `green`        | #18e09a | Success states, positive actions  |
| `red`          | #f95741 | Error states, destructive actions |

### Font Weights

- `font-normal` (400) - Body text
- `font-medium` (500) - Emphasized text
- `font-semibold` (600) - Headings
- `font-bold` (700) - Strong emphasis, buttons

### Common Sizes

- Text: `text-xs` (11px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px)
- Spacing: `2` (8px), `3` (12px), `4` (16px), `6` (24px), `8` (32px)
- Rounded: `rounded` (4px), `rounded-md` (6px), `rounded-lg` (8px)

## 🚀 Migration Checklist

When converting an app from Pico CSS to Tailwind:

- [ ] Remove Pico CSS `<link>` tags
- [ ] Add Tailwind setup (see Quick Start)
- [ ] Remove `ui.css` loading code
- [ ] Replace custom CSS classes with Tailwind utilities
- [ ] Update buttons to use button patterns
- [ ] Update inputs to use input patterns
- [ ] Update tables to use table patterns
- [ ] Test all interactive states (hover, focus, disabled)
- [ ] Verify responsive behavior
- [ ] Check accessibility (focus states, contrast)

---

**Need help?** Check the [README-TAILWIND.md](./README-TAILWIND.md) for more details or see the [ask_any_llm app](./open_router/ask_any_llm/app.html) for a complete example.
