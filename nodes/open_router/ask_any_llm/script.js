import { encodeBase64 } from "jsr:@std/encoding@1/base64";
import { next, throwError } from "../../../utils/node.js";
import { PRICES } from "./prices.js";

// https://openrouter.ai/models?fmt=table&input_modalities=text&output_modalities=text

function estimateTokens(text) {
  return Math.ceil((text?.length || 0) / 4);
}

const _1M = 1000_000;

export function costs({ env, inputs, usage }) {
  if (env.scope.OPENROUTER_API_KEY === "user") {
    return 0;
  }

  const {
    model = "qwen/qwen3-vl-8b-instruct",
    instructions,
    question,
  } = inputs;
  const prices = PRICES[model] || { in: 0.064, out: 0.4 };

  let tokens = {
    input: estimateTokens(instructions) + estimateTokens(question),
    output: 500,
  };

  if (usage) {
    const { prompt_tokens, completion_tokens } = usage;
    tokens = {
      input: prompt_tokens,
      output: completion_tokens,
    };
  }

  const costs = {
    input: (tokens.input / _1M) * prices.in,
    output: (tokens.output / _1M) * prices.out,
  };

  return costs.input + costs.output;
}

async function imageToBase64(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throwError.fatal(`Failed to download image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  const mimeType = response.headers.get("content-type") || "image/jpeg";

  // Use Deno's built-in base64 encoding
  const base64 = encodeBase64(buffer);
  return `data:${mimeType};base64,${base64}`;
}

export async function run({ inputs, env }) {
  const { OPENROUTER_API_KEY } = env.variables;
  if (!OPENROUTER_API_KEY) {
    throwError.fatal("Please set your API key for OpenRouter");
  }

  const {
    model = "qwen/qwen3-vl-8b-instruct",
    instructions,
    question,
    image,
    answerFormat,
    temperature,
    max_tokens,
    top_p,
  } = inputs;

  const messages = [];

  if (instructions) {
    messages.push({
      role: "system",
      content: instructions,
    });
  }

  if (answerFormat === "json") {
    messages.push({
      role: "system",
      content: "Respond in JSON format.",
    });
  }

  let content = question;

  if (image) {
    content = [
      {
        type: "text",
        text: question,
      },
      {
        type: "image_url",
        image_url: {
          url: await imageToBase64(image),
        },
      },
    ];
  }

  messages.push({
    role: "user",
    content,
  });

  const request = {
    model,
    messages,
    temperature,
    max_tokens,
    top_p,
    ...(answerFormat === "json"
      ? { response_format: { type: "json_object" } }
      : {}),
  };

  console.log(JSON.stringify(request, null, 2));

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://piper.my",
          "X-Title": "Piper - Ask Any LLM Node",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData?.metadata?.raw ||
        errorData?.error?.message ||
        `${response.status}: ${response.statusText}`;
      throwError.fatal(message);
    }

    const { choices, usage } = await response.json();
    const answer = choices?.[0]?.message?.content;
    if (!answer) {
      throwError.fatal("No answer received");
    }
    switch (answerFormat) {
      case "json":
        try {
          console.log(`Parse JSON: ${answer}`);

          const json = JSON.parse(answer);
          return next({
            outputs: { json },
            costs: costs({ env, inputs, usage }),
          });
        } catch (_e) {
          throwError.fatal("Can't parse JSON answer from model");
        }
        break;
      case "text":
      default:
        return next({
          outputs: { answer },
          costs: costs({ env, inputs, usage }),
        });
    }
  } catch (error) {
    throwError.fatal(`Request failed: ${error.message}`);
  }
}
