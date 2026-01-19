import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const env = await load({
  envPath: ".env",
  export: true,
});

Deno.test("Ask Any LLM: Simple text question", async () => {
  const result = await runNode(run, {
    inputs: {
      question: "What is 2+2? Answer with just the number.",
      model: "qwen/qwen3-8b",
      answerFormat: "text",
    },
    env: {
      scope: {
        OPENROUTER_API_KEY: "global",
      },
      variables: {
        OPENROUTER_API_KEY: env.OPENROUTER_API_KEY,
      },
    },
  });

  console.log("Answer:", result.outputs.answer);
  if (!result.outputs.answer) {
    throw new Error("No answer received");
  }
  if (!result.outputs.answer.includes("4")) {
    throw new Error("Expected answer to contain '4'");
  }
});

Deno.test("Ask Any LLM: JSON response", async () => {
  const result = await runNode(run, {
    inputs: {
      question:
        'Return a JSON object with a field "result" set to the number 42',
      model: "qwen/qwen3-8b",
      answerFormat: "json",
    },
    env: {
      scope: {
        OPENROUTER_API_KEY: "global",
      },
      variables: {
        OPENROUTER_API_KEY: env.OPENROUTER_API_KEY,
      },
    },
  });

  console.log("JSON:", result.outputs.json);
  if (!result.outputs.json) {
    throw new Error("No JSON received");
  }
  if (result.outputs.json.result !== 42) {
    throw new Error("Expected result to be 42");
  }
});

Deno.test("Ask Any LLM: With system instructions", async () => {
  const result = await runNode(run, {
    inputs: {
      question: "What is your role?",
      model: "qwen/qwen3-8b",
      instructions: "You are a helpful math tutor.",
      answerFormat: "text",
    },
    env: {
      scope: {
        OPENROUTER_API_KEY: "global",
      },
      variables: {
        OPENROUTER_API_KEY: env.OPENROUTER_API_KEY,
      },
    },
  });

  console.log("Answer:", result.outputs.answer);
  if (!result.outputs.answer) {
    throw new Error("No answer received");
  }
});

Deno.test("Ask Any LLM: Vision model with image", async () => {
  const result = await runNode(run, {
    inputs: {
      question: "What do you see in this image?",
      model: "qwen/qwen3-vl-8b-instruct",
      image: "https://picsum.photos/800/600",
      answerFormat: "text",
    },
    env: {
      scope: {
        OPENROUTER_API_KEY: "global",
      },
      variables: {
        OPENROUTER_API_KEY: env.OPENROUTER_API_KEY,
      },
    },
  });

  console.log("Answer:", result.outputs.answer);
  if (!result.outputs.answer) {
    throw new Error("No answer received");
  }
});

Deno.test("Ask Any LLM: Cost estimation", () => {
  const estimatedCost = costs({
    env: {
      scope: {
        OPENROUTER_API_KEY: "global",
      },
    },
    inputs: {
      model: "qwen/qwen3-8b",
      instructions: "You are a helpful assistant.",
      question: "What is the meaning of life?",
    },
  });

  console.log("Estimated cost:", estimatedCost);
  if (estimatedCost <= 0) {
    throw new Error("Expected positive cost estimate");
  }
});

Deno.test("Ask Any LLM: Cost calculation with usage", () => {
  const actualCost = costs({
    env: {
      scope: {
        OPENROUTER_API_KEY: "global",
      },
    },
    inputs: {
      model: "qwen/qwen3-8b",
      instructions: "You are a helpful assistant.",
      question: "What is the meaning of life?",
    },
    usage: {
      prompt_tokens: 100,
      completion_tokens: 200,
    },
  });

  console.log("Actual cost:", actualCost);
  if (actualCost <= 0) {
    throw new Error("Expected positive cost");
  }
});
