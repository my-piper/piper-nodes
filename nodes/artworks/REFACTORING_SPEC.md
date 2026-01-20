# ArtWorks Nodes Refactoring Specification

This document describes how to refactor ArtWorks nodes from the old CommonJS pattern to the new ES modules pattern, based on the `generate_image` node refactoring.

## Overview

The refactoring involves:

1. Converting from CommonJS `require()` to ES6 `import` statements
2. Moving shared utilities to a centralized location
3. Removing unnecessary `download()` calls for image URLs
4. Improving error handling in catch blocks
5. Removing debug console.log statements

---

## Key Changes

### 1. Import Statements

**OLD (CommonJS):**

```javascript
export async function run({ env, inputs, state }) {
  const { throwError, repeat, next, download } = require("@piper/node");
  const { ArtWorks, FatalError } = require("artworks");
  // ... rest of code
}
```

**NEW (ES Modules):**

```javascript
import { next, repeat, throwError } from "../../../utils/node.js";
import { ArtWorks, FatalError } from "../utils.js";

export async function run({ env, inputs, state }) {
  // ... rest of code (no require statements)
}
```

**Changes:**

- Move `require()` calls outside the function to top-level `import` statements
- Import from `../../../utils/node.js` for node utilities
- Import from `../utils.js` for ArtWorks-specific utilities
- Remove `download` import if not needed (see section 3)

---

### 2. Costs Function

**OLD:**

```javascript
export async function costs({ env }) {
  // ... implementation
}
```

**NEW:**

```javascript
export function costs({ env, inputs }) {
  // ... implementation (no async needed if not using await)
}
```

**Changes:**

- Remove `async` keyword if the function doesn't use `await`
- Add `inputs` parameter if needed for cost calculation
- Add default values for destructured inputs: `const { batchSize = 1, performance = "speed" } = inputs;`

---

### 3. Image URL Handling

**OLD (downloading images):**

```javascript
let images = results.images.map((i) => i.url);
return next({
  outputs: {
    images: (await Promise.all(images.map((url) => download(url)))).map(
      ({ data }) => data
    ),
  },
  costs: costs({ env, inputs }),
});
```

**NEW (returning URLs directly):**

```javascript
const images = results.images.map((i) => i.url);
return next({
  outputs: {
    images,
  },
  costs: costs({ env, inputs }),
});
```

**Changes:**

- Return image URLs directly instead of downloading them
- Remove `download()` calls
- Change `let` to `const` where appropriate
- Remove `download` from imports

---

### 4. Error Handling in Catch Blocks

**OLD:**

```javascript
try {
  await artworks.cancelTask(task);
} catch (e) {}
```

**NEW:**

```javascript
try {
  await artworks.cancelTask(task);
} catch (_e) {
  // Ignore errors when canceling task
}
```

**Changes:**

- Prefix unused error variable with underscore: `_e`
- Add explanatory comment in the catch block

---

### 5. Debug Logging

**OLD:**

```javascript
const payload = { /* ... */ };
console.log(JSON.stringify(payload, null, 2));

try {
  const task = await artworks.createTask(payload);
  // ...
}
```

**NEW:**

```javascript
const payload = { /* ... */ };

try {
  const task = await artworks.createTask(payload);
  // ...
}
```

**Changes:**

- Remove `console.log(JSON.stringify(payload, null, 2))` statements
- The logging is now handled inside `artworks.createTask()` in `utils.js`

---

## Step-by-Step Refactoring Process

For each node in `nodes/artworks/`:

1. **Add imports at the top:**

   ```javascript
   import { next, repeat, throwError } from "../../../utils/node.js";
   import { ArtWorks, FatalError } from "../utils.js";
   ```

2. **Remove `require()` statements** from inside the `run()` function

3. **Update `costs()` function:**
   - Remove `async` if not needed
   - Add `inputs` parameter if needed
   - Add default values for destructured inputs

4. **Remove debug logging:**
   - Delete `console.log(JSON.stringify(payload, null, 2))` lines

5. **Update error handling:**
   - Change `catch (e) {}` to `catch (_e) { // Ignore errors when canceling task }`

6. **Update image handling** (if applicable):
   - Remove `download()` calls
   - Return URLs directly instead of downloaded data
   - Remove `download` from imports

7. **Test the refactored node** to ensure it works correctly

---

## Files to Refactor

All nodes in `nodes/artworks/` except `generate_image` (already refactored):

- [ ] ask_llm_agent
- [ ] classify_image
- [ ] describe_image_artworks
- [ ] detect_face
- [ ] detect_nsfw
- [ ] dress_on_image
- [ ] extract_frame
- [ ] extract_mask
- [ ] face_swap_on_image
- [ ] faceswap_on_video
- [ ] image_to_image
- [ ] image_to_prompt
- [ ] inpaint_image
- [ ] merge_videos
- [ ] outpaint_on_image
- [ ] pulid
- [ ] remove_background
- [ ] srore_aesthetics
- [ ] translate_text
- [ ] upscale_image
- [ ] wan_2_2

---

## Notes

- The `utils.js` file contains the `ArtWorks` class and `FatalError` class
- The `ArtWorks` class now handles payload logging internally
- Image URLs are preferred over downloaded image data for better performance
- All nodes should follow the same pattern for consistency

---

## Complete Example: Before & After

### BEFORE (script.old.js pattern):

```javascript
const CHECK_TASK_INTERVAL = 3000;
const MAX_ATTEMPTS = 20;

export async function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.005;
}

export async function run({ inputs, state, env }) {
  const { throwError, repeat, next, download } = require("@piper/node");
  const { ArtWorks, FatalError } = require("artworks");

  const { ARTWORKS_USER, ARTWORKS_PASSWORD } = env.variables;
  if (!ARTWORKS_USER) {
    throwError.fatal("Please, set ARTWORKS_USER in environment");
  }
  if (!ARTWORKS_PASSWORD) {
    throwError.fatal("Please, set ARTWORKS_PASSWORD in environment");
  }

  const artworks = new ArtWorks({
    baseUrl: "https://api.artworks.ai",
    username: ARTWORKS_USER,
    password: ARTWORKS_PASSWORD,
  });

  if (!state) {
    const { image } = inputs;

    const payload = {
      type: "some-task",
      isFast: true,
      payload: {
        base64: false,
        image,
      },
    };

    console.log(JSON.stringify(payload, null, 2));

    try {
      const task = await artworks.createTask(payload);
      console.log(`Task created ${task}`);
      return repeat({
        state: {
          task,
          attempt: 0,
          startedAt: new Date().toISOString(),
        },
        progress: {
          total: MAX_ATTEMPTS,
          processed: 0,
        },
        delay: 2000,
      });
    } catch (e) {
      if (e instanceof FatalError) {
        throwError.fatal(e.message);
      }
      throw e;
    }
  } else {
    const { task, attempt, startedAt } = state;

    if (attempt > MAX_ATTEMPTS) {
      try {
        await artworks.cancelTask(task);
      } catch (e) {}

      const now = new Date();
      const time = (now - new Date(startedAt)) / 1000;
      throwError.timeout(`Task ${task} timeout in ${time} sec`);
    }

    console.log(`Check task ${attempt} ${task}`);

    try {
      const results = await artworks.checkState(task);
      if (!results) {
        return repeat({
          delay: CHECK_TASK_INTERVAL,
          state: {
            task,
            attempt: attempt + 1,
            startedAt,
          },
          progress: {
            total: MAX_ATTEMPTS,
            processed: attempt,
          },
        });
      }
      let {
        images: [{ url }],
      } = results;
      const { data: image } = await download(url);
      return next({
        outputs: { image },
        costs: costs({ env, inputs }),
      });
    } catch (e) {
      if (e instanceof FatalError) {
        throwError.fatal(e.message);
      }
      throw e;
    }
  }
}
```

### AFTER (new pattern):

```javascript
import { next, repeat, throwError } from "../../../utils/node.js";
import { ArtWorks, FatalError } from "../utils.js";

const CHECK_TASK_INTERVAL = 3000;
const MAX_ATTEMPTS = 20;

export function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.005;
}

export async function run({ inputs, state, env }) {
  const { ARTWORKS_USER, ARTWORKS_PASSWORD } = env.variables;
  if (!ARTWORKS_USER) {
    throwError.fatal("Please, set ARTWORKS_USER in environment");
  }
  if (!ARTWORKS_PASSWORD) {
    throwError.fatal("Please, set ARTWORKS_PASSWORD in environment");
  }

  const artworks = new ArtWorks({
    baseUrl: "https://api.artworks.ai",
    username: ARTWORKS_USER,
    password: ARTWORKS_PASSWORD,
  });

  if (!state) {
    const { image } = inputs;

    const payload = {
      type: "some-task",
      isFast: true,
      payload: {
        base64: false,
        image,
      },
    };

    try {
      const task = await artworks.createTask(payload);
      console.log(`Task created ${task}`);
      return repeat({
        state: {
          task,
          attempt: 0,
          startedAt: new Date().toISOString(),
        },
        progress: {
          total: MAX_ATTEMPTS,
          processed: 0,
        },
        delay: 2000,
      });
    } catch (e) {
      if (e instanceof FatalError) {
        throwError.fatal(e.message);
      }
      throw e;
    }
  } else {
    const { task, attempt, startedAt } = state;

    if (attempt > MAX_ATTEMPTS) {
      try {
        await artworks.cancelTask(task);
      } catch (_e) {
        // Ignore errors when canceling task
      }

      const now = new Date();
      const time = (now - new Date(startedAt)) / 1000;
      throwError.timeout(`Task ${task} timeout in ${time} sec`);
    }

    console.log(`Check task ${attempt} ${task}`);

    try {
      const results = await artworks.checkState(task);
      if (!results) {
        return repeat({
          delay: CHECK_TASK_INTERVAL,
          state: {
            task,
            attempt: attempt + 1,
            startedAt,
          },
          progress: {
            total: MAX_ATTEMPTS,
            processed: attempt,
          },
        });
      }
      const {
        images: [{ url }],
      } = results;
      return next({
        outputs: { image: url },
        costs: costs({ env, inputs }),
      });
    } catch (e) {
      if (e instanceof FatalError) {
        throwError.fatal(e.message);
      }
      throw e;
    }
  }
}
```

### Key Differences Highlighted:

1. ✅ **Imports moved to top** (lines 1-2)
2. ✅ **Removed `async` from `costs()`** (line 6)
3. ✅ **Removed `require()` statements** from inside `run()`
4. ✅ **Removed debug logging** (removed `console.log(JSON.stringify(payload, null, 2))`)
5. ✅ **Fixed empty catch block** (line 73-75)
6. ✅ **Removed `download()` call** (line 103)
7. ✅ **Return URL directly** instead of downloaded data (line 104)
