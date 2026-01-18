# Replicate Nodes Refactoring - Quick Reference

## 🎯 Goal

Migrate from old pattern (manual HTTP + error handling) to new pattern (utility functions)

## 📊 Impact

- **Line reduction**: ~39% (149 → 90 lines)
- **Cleaner code**: Centralized error handling
- **Better maintainability**: Shared utilities

---

## ✅ 8-Step Checklist

1. [ ] Add ES6 imports at top
2. [ ] Remove `catchError` function
3. [ ] Remove `require("@piper/node")` from `run()`
4. [ ] Replace initial `httpRequest` with `predict()`
5. [ ] Replace polling logic with `getOutput()`
6. [ ] Remove `download()` calls
7. [ ] Remove all `try-catch` blocks
8. [ ] Test the node

---

## 🔄 Quick Transformations

### 1. Top of File

```javascript
// ADD THIS:
import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";
```

### 2. Remove catchError

```javascript
// DELETE THIS ENTIRE FUNCTION:
function catchError(error) { ... }
```

### 3. Remove require() from run()

```javascript
// DELETE THIS:
const {
  repeat,
  next,
  throwError,
  httpRequest,
  download,
} = require("@piper/node");
```

### 4. Initial Prediction

```javascript
// REPLACE:
try {
  const {
    data: { id: task },
  } = await httpRequest({
    method: "post",
    url: `https://api.replicate.com/v1/models/${MODEL_PATHS[model]}/predictions`,
    data: { input: payload },
    headers: {
      Authorization: `Bearer ${REPLICATE_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  return repeat({ state: { task, retries: 0 }, delay: CHECK_INTERVAL });
} catch (e) {
  catchError(e);
}

// WITH:
const task = await predict(
  { apiToken: REPLICATE_TOKEN },
  `models/${MODEL_PATHS[model]}/predictions`,
  payload
);
return repeat({ state: { task, retries: 0 }, delay: CHECK_INTERVAL });
```

### 5. Polling Logic

```javascript
// REPLACE:
try {
  const { data } = await httpRequest({
    method: "get",
    url: `https://api.replicate.com/v1/predictions/${task}`,
    headers: {
      Authorization: `Bearer ${REPLICATE_TOKEN}`,
      "Content-Type": "application/json",
    },
  });
  const { status, error, output } = data;
  switch (status) {
    case "starting":
    case "processing":
      if (retries >= MAX_RETRIES) {
        throwError.fatal("Generation timeout exceeded");
      }
      return repeat({
        state: { task, retries: retries + 1 },
        progress: { total: MAX_RETRIES, processed: retries },
        delay: CHECK_INTERVAL,
      });
    case "failed":
    case "canceled":
      catchError(error);
    case "succeeded":
      const { data: image } = await download(output);
      return next({ outputs: { image }, costs: await costs({ env, inputs }) });
    default:
      throwError.fatal(`Unknown status: ${status}`);
  }
} catch (e) {
  catchError(e);
}

// WITH:
const output = await getOutput({ apiToken: REPLICATE_TOKEN }, task);
if (!output) {
  if (retries >= MAX_RETRIES) {
    throwError.fatal("Generation timeout exceeded");
  }
  return repeat({
    state: { task, retries: retries + 1 },
    progress: { total: MAX_RETRIES, processed: retries },
    delay: CHECK_INTERVAL,
  });
}
return next({
  outputs: { image: output },
  costs: await costs({ env, inputs }),
});
```

---

## 🔧 Endpoint Transformations

### Multiple Models

```javascript
// OLD: url: `https://api.replicate.com/v1/models/${MODEL_PATHS[model]}/predictions`
// NEW: `models/${MODEL_PATHS[model]}/predictions`
```

### Fixed Model

```javascript
// OLD: url: "https://api.replicate.com/v1/models/recraft-ai/recraft-v3/predictions"
// NEW: `models/recraft-ai/recraft-v3/predictions`
```

### Specific Version

```javascript
// OLD: url: "https://api.replicate.com/v1/models/prunaai/z-image-turbo/versions/ABC123.../predictions"
// NEW: `models/prunaai/z-image-turbo/versions/ABC123.../predictions`
```

---

## 📦 Output Handling

### Single Image

```javascript
// OLD: const { data: image } = await download(output);
//      return next({ outputs: { image }, ... });

// NEW: return next({ outputs: { image: output }, ... });
```

### Multiple Images

```javascript
// OLD: const images = (await Promise.all(output.map((url) => download(url)))).map(({ data }) => data);
//      return next({ outputs: { images }, ... });

// NEW: return next({ outputs: { images: output }, ... });
```

---

## 📝 Nodes to Refactor

- [x] sd_3_5 (reference)
- [ ] recraft_v3
- [ ] hunyuan_Image
- [ ] ideogram_v3
- [ ] google_imagen4
- [ ] z_image_turbo
- [ ] recraft_v3_svg
- [ ] seededit_3
- [ ] recraft_vectorize
- [ ] qwen_image
- [ ] runway_gen4_image
- [ ] seedream
- [ ] minimax_image_1
- [ ] flux_kontext
- [ ] luma_photon
- [ ] ideogram_v3_character
- [ ] nano_banana
- [ ] nano_banana_pro

---

## 📚 Full Documentation

See `REFACTORING_SPEC.md` for complete details and examples.
