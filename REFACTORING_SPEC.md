# Replicate Nodes Refactoring Specification

## Overview

This document specifies the refactoring pattern for migrating Replicate nodes from the old pattern (using `require("@piper/node")` and manual HTTP requests) to the new pattern (using ES6 imports and utility functions).

## Reference Implementation

- **New (Refactored)**: `nodes/replicate/generate_images/sd_3_5/script.js`
- **Old (Original)**: `nodes/replicate/generate_images/sd_3_5_old/script.js`

---

## Key Changes

### 1. **Import Statements**

#### OLD Pattern:

```javascript
// No imports at the top
// Everything imported via require() inside functions
```

#### NEW Pattern:

```javascript
import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";
```

**Changes:**

- Add ES6 imports at the top of the file
- Import `next`, `repeat`, `throwError` from `../../../../utils/node.js`
- Import `getOutput`, `predict` from `../../utils.js`
- Remove all `require("@piper/node")` calls from inside functions

---

### 2. **Remove catchError Function**

#### OLD Pattern:

```javascript
function catchError(error) {
  const { throwError } = require("@piper/node");

  const errorData = error.response?.data;
  const message =
    errorData?.detail || errorData?.error || error.message || error;
  if (message?.includes("E005") || message?.includes("sensitive")) {
    throwError.fatal(
      "Content flagged as sensitive. Please try different prompt."
    );
  }

  throwError.fatal(message);
}
```

#### NEW Pattern:

```javascript
// Remove the entire catchError function
// Error handling is now done in utils.js
```

**Changes:**

- Delete the entire `catchError` function
- Error handling is centralized in `nodes/replicate/utils.js`

---

### 3. **Refactor run() Function - Remove require() Calls**

#### OLD Pattern:

```javascript
export async function run({ env, inputs, state }) {
  const {
    repeat,
    next,
    throwError,
    httpRequest,
    download,
  } = require("@piper/node");

  const { REPLICATE_TOKEN } = env.variables;
  // ...
}
```

#### NEW Pattern:

```javascript
export async function run({ env, inputs, state }) {
  const { REPLICATE_TOKEN } = env.variables;
  // ...
}
```

**Changes:**

- Remove the `require("@piper/node")` destructuring
- `next`, `repeat`, `throwError` are now imported at the top
- `httpRequest` and `download` are no longer needed (replaced by utility functions)

---

### 4. **Refactor Initial Prediction Request**

#### OLD Pattern:

```javascript
if (!state) {
  const payload = {
    prompt,
    // ... other fields
  };

  console.log(JSON.stringify(payload, null, 2));

  try {
    const {
      data: { id: task },
    } = await httpRequest({
      method: "post",
      url: `https://api.replicate.com/v1/models/${MODEL_PATHS[model]}/predictions`,
      data: {
        input: payload,
      },
      headers: {
        Authorization: `Bearer ${REPLICATE_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    return repeat({
      state: { task, retries: 0 },
      delay: CHECK_INTERVAL,
    });
  } catch (e) {
    catchError(e);
  }
}
```

#### NEW Pattern:

```javascript
if (!state) {
  const payload = {
    prompt,
    // ... other fields
  };

  const task = await predict(
    { apiToken: REPLICATE_TOKEN },
    `models/${MODEL_PATHS[model]}/predictions`,
    payload
  );
  return repeat({
    state: { task, retries: 0 },
    delay: CHECK_INTERVAL,
  });
}
```

**Changes:**

- Remove `console.log(JSON.stringify(payload, null, 2))` (now in `predict()`)
- Remove `try-catch` block
- Replace `httpRequest` call with `predict()` utility function
- `predict()` parameters:
  1. `{ apiToken: REPLICATE_TOKEN }` - config object
  2. `models/${MODEL_PATHS[model]}/predictions` - endpoint (without base URL or `/v1/`)
  3. `payload` - the input payload
- Remove `https://api.replicate.com/v1/` from the endpoint (handled by `predict()`)

---

### 5. **Refactor Polling/Status Check Logic**

#### OLD Pattern:

```javascript
} else {
  const { task, retries = 0 } = state;

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
          progress: {
            total: MAX_RETRIES,
            processed: retries,
          },
          delay: CHECK_INTERVAL,
        });

      case "failed":
      case "canceled":
        catchError(error);
      case "succeeded":
        const { data: image } = await download(output);
        return next({
          outputs: { image },
          costs: await costs({ env, inputs }),
        });
      default:
        throwError.fatal(`Unknown status: ${status}`);
    }
  } catch (e) {
    catchError(e);
  }
}
```

#### NEW Pattern:

```javascript
} else {
  const { task, retries = 0 } = state;

  const output = await getOutput({ apiToken: REPLICATE_TOKEN }, task);
  if (!output) {
    if (retries >= MAX_RETRIES) {
      throwError.fatal("Generation timeout exceeded");
    }
    return repeat({
      state: { task, retries: retries + 1 },
      progress: {
        total: MAX_RETRIES,
        processed: retries,
      },
      delay: CHECK_INTERVAL,
    });
  }

  return next({
    outputs: { image: output },
    costs: await costs({ env, inputs }),
  });
}
```

**Changes:**

- Remove `try-catch` block
- Remove manual `httpRequest` call
- Replace entire `switch` statement with `getOutput()` utility function
- `getOutput()` returns:
  - `null` if task is still processing (status: "starting" or "processing")
  - The output URL/data if succeeded
  - Throws error if failed/canceled
- Remove `download()` call - output is now returned directly as URL
- Simplify to just check if `output` is null (still processing) or has value (completed)

---

### 6. **Output Handling**

#### For Single Image Output:

**OLD:**

```javascript
const { data: image } = await download(output);
return next({
  outputs: { image },
  costs: await costs({ env, inputs }),
});
```

**NEW:**

```javascript
return next({
  outputs: { image: output },
  costs: await costs({ env, inputs }),
});
```

#### For Multiple Images Output:

**OLD:**

```javascript
const images = (await Promise.all(output.map((url) => download(url)))).map(
  ({ data }) => data
);
return next({
  outputs: { images },
  costs: await costs({ env, inputs }),
});
```

**NEW:**

```javascript
return next({
  outputs: { images: output },
  costs: await costs({ env, inputs }),
});
```

**Changes:**

- Remove `download()` calls entirely
- Pass the output URL(s) directly to `next()`
- The download is handled by the backend/runtime, not in the node script

---

## Special Cases

### Nodes with Multiple Model Variants

For nodes that support multiple models (e.g., `sd_3_5`, `ideogram_v3`, `flux_kontext`):

**Endpoint Construction:**

```javascript
// OLD
url: `https://api.replicate.com/v1/models/${MODEL_PATHS[model]}/predictions`
// NEW
`models/${MODEL_PATHS[model]}/predictions`;
```

### Nodes with Fixed Model Paths

For nodes with a single fixed model (e.g., `recraft_v3`, `luma_photon`):

**OLD:**

```javascript
url: "https://api.replicate.com/v1/models/recraft-ai/recraft-v3/predictions";
```

**NEW:**

```javascript
`models/recraft-ai/recraft-v3/predictions`;
```

### Nodes with Specific Versions

For nodes using specific version hashes (e.g., `z_image_turbo`):

**OLD:**

```javascript
url: "https://api.replicate.com/v1/models/prunaai/z-image-turbo/versions/7ea16386290ff5977c7812e66e462d7ec3954d8e007a8cd18ded3e7d41f5d7cf/predictions";
```

**NEW:**

```javascript
`models/prunaai/z-image-turbo/versions/7ea16386290ff5977c7812e66e462d7ec3954d8e007a8cd18ded3e7d41f5d7cf/predictions`;
```

---

## Complete Refactoring Checklist

For each node, perform these steps in order:

- [ ] 1. Add ES6 import statements at the top
- [ ] 2. Remove the `catchError` function
- [ ] 3. Remove `require("@piper/node")` from `run()` function
- [ ] 4. Replace initial prediction `httpRequest` with `predict()` utility
- [ ] 5. Replace polling logic with `getOutput()` utility
- [ ] 6. Remove `download()` calls from output handling
- [ ] 7. Remove all `try-catch` blocks
- [ ] 8. Test the refactored node

---

## Nodes to Refactor

Based on the directory structure, the following nodes need refactoring:

1. ✅ `sd_3_5` - Already refactored (reference implementation)
2. ✅ `recraft_v3` - Refactored (122 → 67 lines, 45% reduction)
3. ⬜ `hunyuan_Image`
4. ⬜ `ideogram_v3`
5. ⬜ `google_imagen4`
6. ⬜ `z_image_turbo`
7. ⬜ `recraft_v3_svg`
8. ⬜ `seededit_3`
9. ⬜ `recraft_vectorize`
10. ⬜ `qwen_image`
11. ⬜ `runway_gen4_image`
12. ⬜ `seedream`
13. ⬜ `minimax_image_1`
14. ⬜ `flux_kontext`
15. ⬜ `luma_photon`
16. ⬜ `ideogram_v3_character`
17. ⬜ `nano_banana`
18. ⬜ `nano_banana_pro`

---

## Utility Functions Reference

### `predict(config, endpoint, payload)`

**Location:** `nodes/replicate/utils.js`

**Purpose:** Initiates a prediction request to Replicate API

**Parameters:**

- `config`: `{ apiToken: string, version?: string }` - API configuration (version defaults to "v1")
- `endpoint`: `string` - API endpoint path (e.g., `"models/recraft-ai/recraft-v3/predictions"`)
- `payload`: `object` - Input parameters for the model

**Returns:** `Promise<string>` - The task ID

**Example:**

```javascript
const task = await predict(
  { apiToken: REPLICATE_TOKEN },
  `models/${MODEL_PATHS[model]}/predictions`,
  payload
);
```

---

### `getOutput(config, task)`

**Location:** `nodes/replicate/utils.js`

**Purpose:** Polls for prediction result

**Parameters:**

- `config`: `{ apiToken: string, version?: string }` - API configuration
- `task`: `string` - The task ID from `predict()`

**Returns:**

- `null` - If task is still processing
- `string | string[]` - Output URL(s) if succeeded
- Throws error if failed/canceled

**Example:**

```javascript
const output = await getOutput({ apiToken: REPLICATE_TOKEN }, task);
if (!output) {
  // Still processing, repeat
  return repeat({
    state: { task, retries: retries + 1 },
    delay: CHECK_INTERVAL,
  });
}
// Success, return output
return next({
  outputs: { image: output },
  costs: await costs({ env, inputs }),
});
```

---

## Notes

1. **Error Handling**: The new pattern relies on utility functions to handle errors. Errors are thrown automatically by `predict()` and `getOutput()`, so no manual error handling is needed.

2. **Logging**: The `console.log(JSON.stringify(payload, null, 2))` is now handled inside the `predict()` function.

3. **Download Handling**: The backend runtime handles downloading the output URLs. Node scripts should return URLs, not downloaded data.

4. **Backwards Compatibility**: The old pattern will continue to work, but all new nodes should use the new pattern.

5. **Testing**: After refactoring, test each node to ensure:
   - Predictions are initiated correctly
   - Polling works as expected
   - Outputs are returned in the correct format
   - Error cases are handled properly

---

## Example: Complete Before and After

### Complete OLD Implementation (149 lines):

```javascript
export async function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  const { model = "medium" } = inputs;
  switch (model) {
    case "large":
      return 0.065;
    case "medium":
    default:
      return 0.035;
  }
}

const CHECK_INTERVAL = 2000;
const MAX_RETRIES = 100;

const MODEL_PATHS = {
  medium: "stability-ai/stable-diffusion-3.5-medium",
  large: "stability-ai/stable-diffusion-3.5-large",
};

function catchError(error) {
  const { throwError } = require("@piper/node");
  const errorData = error.response?.data;
  const message =
    errorData?.detail || errorData?.error || error.message || error;
  if (message?.includes("E005") || message?.includes("sensitive")) {
    throwError.fatal(
      "Content flagged as sensitive. Please try different prompt."
    );
  }
  throwError.fatal(message);
}

export async function run({ env, inputs, state }) {
  const {
    repeat,
    next,
    throwError,
    httpRequest,
    download,
  } = require("@piper/node");
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

  const {
    model = "medium",
    prompt,
    aspect_ratio,
    cfg,
    negative_prompt,
    seed,
    image,
    prompt_strength,
    output_format,
  } = inputs;

  if (!state) {
    const payload = {
      prompt,
      aspect_ratio,
      cfg,
      negative_prompt,
      seed,
      image,
      prompt_strength,
      output_format,
    };
    console.log(JSON.stringify(payload, null, 2));

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
  } else {
    const { task, retries = 0 } = state;
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
          return next({
            outputs: { image },
            costs: await costs({ env, inputs }),
          });
        default:
          throwError.fatal(`Unknown status: ${status}`);
      }
    } catch (e) {
      catchError(e);
    }
  }
}
```

### Complete NEW Implementation (90 lines):

```javascript
import { next, repeat, throwError } from "../../../../utils/node.js";
import { getOutput, predict } from "../../utils.js";

export async function costs({ env, inputs }) {
  if (env.scope.REPLICATE_TOKEN === "user") {
    return 0;
  }
  const { model = "medium" } = inputs;
  switch (model) {
    case "large":
      return 0.065;
    case "medium":
    default:
      return 0.035;
  }
}

const CHECK_INTERVAL = 2000;
const MAX_RETRIES = 100;

const MODEL_PATHS = {
  medium: "stability-ai/stable-diffusion-3.5-medium",
  large: "stability-ai/stable-diffusion-3.5-large",
};

export async function run({ env, inputs, state }) {
  const { REPLICATE_TOKEN } = env.variables;
  if (!REPLICATE_TOKEN) {
    throwError.fatal("Please, set your API token for Replicate AI");
  }

  const {
    model = "medium",
    prompt,
    aspect_ratio,
    cfg,
    negative_prompt,
    seed,
    image,
    prompt_strength,
    output_format,
  } = inputs;

  if (!state) {
    const payload = {
      prompt,
      aspect_ratio,
      cfg,
      negative_prompt,
      seed,
      image,
      prompt_strength,
      output_format,
    };
    const task = await predict(
      { apiToken: REPLICATE_TOKEN },
      `models/${MODEL_PATHS[model]}/predictions`,
      payload
    );
    return repeat({ state: { task, retries: 0 }, delay: CHECK_INTERVAL });
  } else {
    const { task, retries = 0 } = state;
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
  }
}
```

**Summary:**

- **Line Count Reduction:** 149 lines → 90 lines (39% reduction)
- **Removed:** `catchError` function, all `try-catch` blocks, all `httpRequest` calls, all `download` calls
- **Added:** ES6 imports, utility function calls
- **Result:** Cleaner, more maintainable code with centralized error handling

---

## End of Specification
