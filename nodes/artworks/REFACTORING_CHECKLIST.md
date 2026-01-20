# ArtWorks Node Refactoring Checklist

Use this checklist when refactoring each node from the old pattern to the new pattern.

## Quick Reference

### 1. Add Imports (Top of File)

```javascript
import { next, repeat, throwError } from "../../../utils/node.js";
import { ArtWorks, FatalError } from "../utils.js";
```

### 2. Remove from `run()` function

```javascript
// DELETE THESE LINES:
const { throwError, repeat, next, download } = require("@piper/node");
const { ArtWorks, FatalError } = require("artworks");
```

### 3. Update `costs()` function

```javascript
// BEFORE:
export async function costs({ env }) {

// AFTER:
export function costs({ env, inputs }) {  // Remove async, add inputs if needed
```

### 4. Remove Debug Logging

```javascript
// DELETE THIS LINE:
console.log(JSON.stringify(payload, null, 2));
```

### 5. Fix Empty Catch Block

```javascript
// BEFORE:
} catch (e) {}

// AFTER:
} catch (_e) {
  // Ignore errors when canceling task
}
```

### 6. Remove Image Downloads (if applicable)

```javascript
// BEFORE:
const { data: image } = await download(url);
return next({
  outputs: { image },
  costs: costs({ env, inputs }),
});

// AFTER:
return next({
  outputs: { image: url },
  costs: costs({ env, inputs }),
});
```

---

## Per-Node Checklist

For each node, check off these items:

- [ ] Added ES6 imports at top of file
- [ ] Removed `require()` statements from `run()` function
- [ ] Updated `costs()` function signature (removed `async` if not needed, added `inputs` if needed)
- [ ] Removed `console.log(JSON.stringify(payload, null, 2))` debug statements
- [ ] Fixed empty catch blocks: `catch (_e) { // comment }`
- [ ] Removed `download()` calls (if returning image URLs)
- [ ] Changed `let` to `const` where appropriate
- [ ] Tested the refactored node

---

## Common Patterns by Node Type

### Image Processing Nodes

- Usually return image URLs instead of downloaded data
- Remove `download` from imports
- Change output from `{ data: image }` to just `url`

### Text Processing Nodes

- Usually don't need `download` at all
- Return text/JSON directly from results

### Video Processing Nodes

- May still need `download` for video files (check case-by-case)
- Follow the same import pattern

---

## Testing After Refactoring

1. Check that the file has no syntax errors
2. Verify imports resolve correctly
3. Test the node in the pipeline
4. Verify outputs match expected format
5. Check error handling works correctly

---

## Node Status Tracker

- [x] generate_image (✅ Already refactored)
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
- [x] image_to_image (✅ Refactored with tests)
- [ ] image_to_prompt
- [ ] inpaint_image
- [ ] merge_videos
- [ ] outpaint_on_image
- [ ] pulid
- [x] remove_background (✅ Refactored with tests)
- [ ] srore_aesthetics
- [x] translate_text (✅ Refactored with tests)
- [x] upscale_image (✅ Refactored with tests)
- [ ] wan_2_2
