# Piper Nodes

A collection of nodes for the Piper workflow automation platform.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Developing New Nodes](#developing-new-nodes)
- [Writing Tests](#writing-tests)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)
- [Best Practices](#best-practices)

## 🚀 Getting Started

### Prerequisites

- [Deno](https://deno.land/) - JavaScript/TypeScript runtime (v1.40.0 or higher)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd piper-nodes

# Create .env file for API keys
cp .env.example .env
# Edit .env and add your API keys

# Start the development server
deno task start
# or
deno task dev
```

The server will be available at `http://localhost:3000`

**Note**: This project uses Deno exclusively. No Node.js or npm required!

## 📁 Project Structure

```
piper-nodes/
├── nodes/                          # All nodes
│   ├── replicate/                  # Replicate AI nodes
│   │   ├── utils.js               # Shared utilities
│   │   └── generate-images/
│   │       └── sd-35-replicate/
│   │           ├── script.js      # Node implementation
│   │           ├── test.js        # Node tests
│   │           └── app.html       # Node UI (optional)
│   ├── composer/                   # Image composition node
│   ├── translate-text/             # Translation node
│   └── video-maker/                # Video generation node
├── utils/                          # Shared utilities
│   └── node.js                    # Node testing utilities
├── test.sh                         # Test runner script
├── deno.json                       # Deno configuration & tasks
├── deno.lock                       # Deno lock file
├── .env                           # Environment variables (create this)
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

## 🛠️ Developing New Nodes

### Node Structure

Each node must export two functions: `costs()` and `run()`.

### Step 1: Create Node Directory

```bash
mkdir -p nodes/my-category/my-node
cd nodes/my-category/my-node
```

### Step 2: Create `script.js`

```javascript
import {
  next,
  repeat,
  throwError,
} from "https://cdn.jsdelivr.net/gh/my-piper/piper-node@v2.0.1/index.js";

/**
 * Calculate the cost of running this node
 * @param {Object} params
 * @param {Object} params.env - Environment variables
 * @param {Object} params.inputs - Input values
 * @returns {number} Cost in dollars
 */
export async function costs({ env, inputs }) {
  // Return 0 for free operations
  // Return actual cost for paid APIs
  return 0;
}

/**
 * Main node execution function
 * @param {Object} params
 * @param {Object} params.env - Environment variables
 * @param {Object} params.inputs - Input values
 * @param {Object} params.state - Node state (for repeat operations)
 * @returns {Object} Node outputs
 */
export async function run({ env, inputs, state }) {
  // 1. Validate inputs
  if (!inputs.prompt) {
    throwError.fatal("Prompt is required");
  }

  // 2. Get API credentials from environment
  const apiToken = env.variables.API_TOKEN || env.scope.API_TOKEN;
  if (!apiToken) {
    throwError.fatal("Please set your API token");
  }

  // 3. Perform the operation
  try {
    const result = await fetch("https://api.example.com/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: inputs.prompt,
      }),
    });

    if (!result.ok) {
      const error = await result.text();
      throwError.fatal(`API error: ${error}`);
    }

    const data = await result.json();

    // 4. Return outputs
    return next({
      output: data.result,
      metadata: data.metadata,
    });
  } catch (error) {
    throwError.fatal(`Failed to process: ${error.message}`);
  }
}
```

### Step 3: Key Concepts

#### Environment Variables

Access environment variables through `env`:

```javascript
// From .env file or user settings
const apiToken = env.variables.API_TOKEN;

// From scope (shared across workflow)
const sharedData = env.scope.SHARED_DATA;
```

#### Control Flow

Use these functions to control node execution:

```javascript
// Continue to next node with outputs
return next({ output: "result" });

// Repeat this node (useful for polling)
return repeat({
  delay: 5000, // Wait 5 seconds before repeating
  state: { attemptCount: (state?.attemptCount || 0) + 1 },
});

// Throw fatal error (stops workflow)
throwError.fatal("Something went wrong");
```

#### State Management

Use `state` for data that persists across `repeat()` calls:

```javascript
export async function run({ env, inputs, state }) {
  const attemptCount = state?.attemptCount || 0;

  if (attemptCount >= 10) {
    throwError.fatal("Max attempts reached");
  }

  const status = await checkStatus(inputs.taskId);

  if (status === "pending") {
    return repeat({
      delay: 2000,
      state: { attemptCount: attemptCount + 1 },
    });
  }

  return next({ result: status });
}
```

## ✅ Writing Tests

### Step 1: Create Test File

Create `test.js` in the same directory as your `script.js`:

```javascript
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { runNode } from "../../../utils/node.js";
import { run } from "./script.js";

// Load environment variables from .env
await load({
  envPath: "../../../.env",
  export: true,
});

describe("My Node", () => {
  it("should process input correctly", async () => {
    const result = await runNode(run, {
      env: {
        scope: {},
        variables: {
          API_TOKEN: Deno.env.get("API_TOKEN"),
        },
      },
      inputs: {
        prompt: "test prompt",
      },
    });

    expect(result.outputs.output).toBeDefined();
    expect(result.costs).toBe(0);
  });

  it("should throw error with missing input", async () => {
    await expect(
      runNode(run, {
        env: { scope: {}, variables: {} },
        inputs: {},
      })
    ).rejects.toThrow("Prompt is required");
  });

  it("should throw error with missing API token", async () => {
    await expect(
      runNode(run, {
        env: { scope: {}, variables: {} },
        inputs: { prompt: "test" },
      })
    ).rejects.toThrow("Please set your API token");
  });
});
```

### Step 2: Test Structure

#### Basic Test

```javascript
Deno.test("My Node - basic test", async () => {
  const result = await runNode(run, {
    env: {
      scope: {},
      variables: { API_TOKEN: "test-token" },
    },
    inputs: { prompt: "test" },
  });

  expect(result.outputs.output).toBeDefined();
});
```

#### Grouped Tests (Recommended)

```javascript
describe("My Node", () => {
  it("should handle valid input", async () => {
    // Test code
  });

  it("should handle errors", async () => {
    // Test code
  });
});
```

### Step 3: Common Test Patterns

#### Testing Successful Execution

```javascript
it("should generate output", async () => {
  const { outputs, costs } = await runNode(run, {
    env: {
      scope: {},
      variables: { API_TOKEN: Deno.env.get("API_TOKEN") },
    },
    inputs: { prompt: "a cat" },
  });

  expect(outputs.output).toBeDefined();
  expect(outputs.output).toMatch(/^https/); // Check URL format
  expect(costs).toBe(0.035); // Check cost
});
```

#### Testing Error Handling

```javascript
it("should throw error with invalid input", async () => {
  await expect(
    runNode(run, {
      env: { scope: {}, variables: {} },
      inputs: { prompt: "" },
    })
  ).rejects.toThrow("Prompt is required");
});
```

#### Testing with Mock Data

```javascript
it("should process mock data", () => {
  const mockData = { id: 1, name: "test" };
  const result = processData(mockData);

  expect(result).toEqual({ id: 1, name: "TEST" });
});
```

### Step 4: Available Assertions

```javascript
// Equality
expect(value).toBe(5); // Strict equality (===)
expect(value).toEqual({ a: 1 }); // Deep equality
expect(value).not.toBe(10); // Negation

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeNull();

// Numbers
expect(value).toBeGreaterThan(5);
expect(value).toBeLessThan(10);
expect(value).toBeCloseTo(3.14, 2);

// Strings
expect(str).toMatch(/pattern/);
expect(str).toContain("substring");

// Arrays/Objects
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(obj).toHaveProperty("key");

// Promises
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
```

## 🧪 Running Tests

### Using test.sh (Recommended)

```bash
# Run all tests
./test.sh

# Run tests matching a pattern
./test.sh "My Node"
./test.sh "SD 3.5"
./test.sh "should generate"

# Watch mode (auto-rerun on file changes)
./test.sh --watch
./test.sh "My Node" --watch

# With coverage
./test.sh --coverage

# Show help
./test.sh --help
```

### Using Deno directly

```bash
# Run all tests
deno task test

# Run specific test file
deno test nodes/my-category/my-node/test.js --allow-net --allow-read --allow-env

# Run with filter
deno test --filter "My Node" --allow-net --allow-read --allow-env

# Watch mode
deno task test:watch
```

### Run only one test

Add `only: true` to run a single test:

```javascript
Deno.test({
  name: "My specific test",
  only: true, // Only this test will run
  fn: async () => {
    // Test code
  },
});
```

## 🔐 Environment Variables

### Setup

Create a `.env` file in the project root:

```bash
# .env
REPLICATE_TOKEN=your_replicate_token_here
API_TOKEN=your_api_token_here
```

### Usage in Nodes

```javascript
export async function run({ env, inputs, state }) {
  // Access from variables
  const token = env.variables.REPLICATE_TOKEN;

  // Access from scope (shared across workflow)
  const sharedData = env.scope.SHARED_DATA;
}
```

### Usage in Tests

```javascript
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

// Load .env file
await load({
  envPath: "../../../.env",
  export: true,
});

// Use in tests
const token = Deno.env.get("REPLICATE_TOKEN");
```

## 📚 Best Practices

### 1. Error Handling

Always validate inputs and provide clear error messages:

```javascript
export async function run({ env, inputs, state }) {
  // Validate required inputs
  if (!inputs.prompt) {
    throwError.fatal("Prompt is required");
  }

  // Validate input format
  if (typeof inputs.prompt !== "string") {
    throwError.fatal("Prompt must be a string");
  }

  // Validate API credentials
  const apiToken = env.variables.API_TOKEN;
  if (!apiToken) {
    throwError.fatal("Please set your API token in settings");
  }

  // Handle API errors gracefully
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.text();
      throwError.fatal(`API error ${response.status}: ${error}`);
    }
  } catch (error) {
    throwError.fatal(`Network error: ${error.message}`);
  }
}
```

### 2. Cost Calculation

Implement accurate cost calculation:

```javascript
export async function costs({ env, inputs }) {
  // Free tier check
  if (env.scope.API_TOKEN === "free") {
    return 0;
  }

  // Calculate based on inputs
  const basePrice = 0.01;
  const multiplier = inputs.quality === "high" ? 2 : 1;

  return basePrice * multiplier;
}
```

### 3. Polling Pattern

Use `repeat()` for async operations:

```javascript
export async function run({ env, inputs, state }) {
  const MAX_ATTEMPTS = 30;
  const attemptCount = state?.attemptCount || 0;

  if (attemptCount >= MAX_ATTEMPTS) {
    throwError.fatal("Operation timed out after 30 attempts");
  }

  // Start task on first attempt
  if (attemptCount === 0) {
    const task = await startTask(inputs);
    return repeat({
      delay: 2000,
      state: { taskId: task.id, attemptCount: 1 },
    });
  }

  // Check task status
  const status = await checkTask(state.taskId);

  if (status.state === "pending" || status.state === "processing") {
    return repeat({
      delay: 2000,
      state: { ...state, attemptCount: attemptCount + 1 },
    });
  }

  if (status.state === "failed") {
    throwError.fatal(`Task failed: ${status.error}`);
  }

  return next({ result: status.output });
}
```

### 4. Shared Utilities

Create shared utilities for common operations:

```javascript
// nodes/my-category/utils.js
export async function catchError(res) {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error ${res.status}: ${errorText}`);
  }
}

export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

### 5. Testing Coverage

Write comprehensive tests:

```javascript
describe("My Node", () => {
  // Test happy path
  it("should process valid input", async () => {
    // ...
  });

  // Test error cases
  it("should throw error with missing input", async () => {
    // ...
  });

  it("should throw error with invalid input format", async () => {
    // ...
  });

  it("should throw error with missing API token", async () => {
    // ...
  });

  // Test edge cases
  it("should handle empty string input", async () => {
    // ...
  });

  it("should handle very long input", async () => {
    // ...
  });
});
```

### 6. Documentation

Add JSDoc comments to your functions:

```javascript
/**
 * Generate an image from a text prompt
 * @param {Object} params - Function parameters
 * @param {Object} params.env - Environment variables
 * @param {string} params.env.variables.API_TOKEN - API authentication token
 * @param {Object} params.inputs - Input values
 * @param {string} params.inputs.prompt - Text prompt for image generation
 * @param {number} [params.inputs.width=1024] - Image width in pixels
 * @param {number} [params.inputs.height=1024] - Image height in pixels
 * @param {Object} [params.state] - Node state for repeat operations
 * @returns {Promise<Object>} Node outputs with generated image URL
 * @throws {Error} When prompt is missing or API request fails
 */
export async function run({ env, inputs, state }) {
  // Implementation
}
```

## 🔗 Real-World Example

See the SD 3.5 Replicate node for a complete example:

- **Location**: `nodes/replicate/generate-images/sd-35-replicate/`
- **Features**:
  - API integration with Replicate
  - Polling pattern for async operations
  - Comprehensive error handling
  - Full test coverage
  - Cost calculation

## 📖 Additional Resources

- [Piper Node Documentation](https://github.com/my-piper/piper-node)
- [Deno Documentation](https://deno.land/manual)
- [Deno Testing](https://deno.land/manual/testing)
- [TESTING.md](./TESTING.md) - Detailed testing guide

## 🤝 Contributing

1. Create a new branch for your node
2. Develop the node following the structure above
3. Write comprehensive tests
4. Ensure all tests pass: `./test.sh` or `deno task test`
5. Format code: `deno task fmt`
6. Lint code: `deno task lint`
7. Submit a pull request

### Development Workflow

```bash
# Start dev server (serves node UIs)
deno task dev

# Run tests in watch mode
deno task test:watch

# Format and lint
deno task fmt
deno task lint

# Run specific tests
./test.sh "My Node"
```

## 📝 License

ISC

---

**Happy coding! 🚀**
