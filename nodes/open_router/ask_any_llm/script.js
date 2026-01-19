import { next, throwError } from "../../../utils/node.js";

// https://openrouter.ai/models?fmt=table&input_modalities=text&output_modalities=text
const PRICES = {
  "x-ai/grok-4.1-fast": { in: 0.2, out: 0.5, context: 2000000, vision: true },
  "x-ai/grok-4-fast": { in: 0.2, out: 0.5, context: 2000000, vision: true },
  "x-ai/grok-code-fast-1": {
    in: 0.2,
    out: 1.5,
    context: 256000,
    vision: false,
  },
  "x-ai/grok-4": { in: 3, out: 15, context: 256000, vision: true },
  "x-ai/grok-3": { in: 3, out: 15, context: 131072, vision: false },
  "x-ai/grok-3-mini": { in: 0.3, out: 0.5, context: 131072, vision: false },
  "deepseek/deepseek-v3.2-speciale": {
    in: 0.27,
    out: 0.41,
    context: 163840,
    vision: false,
  },
  "deepseek/deepseek-v3.2": {
    in: 0.26,
    out: 0.39,
    context: 163840,
    vision: false,
  },
  "deepseek/deepseek-v3.2-exp": {
    in: 0.21,
    out: 0.32,
    context: 163840,
    vision: false,
  },
  "deepseek/deepseek-v3.1-terminus:exacto": {
    in: 0.21,
    out: 0.79,
    context: 163840,
    vision: false,
  },
  "deepseek/deepseek-v3.1-terminus": {
    in: 0.21,
    out: 0.79,
    context: 163840,
    vision: false,
  },
  "deepseek/deepseek-chat-v3.1": {
    in: 0.15,
    out: 0.75,
    context: 8192,
    vision: false,
  },
  "deepseek/deepseek-v3-0324": {
    in: 0.2,
    out: 0.88,
    context: 163840,
    vision: false,
  },
  "deepseek/deepseek-chat": {
    in: 0.3,
    out: 1.2,
    context: 163840,
    vision: false,
  },
  "deepseek/deepseek-r1-0528-qwen3-8b": {
    in: 0.02,
    out: 0.1,
    context: 32768,
    vision: false,
  },
  "deepseek/deepseek-r1-0528": {
    in: 0.4,
    out: 1.75,
    context: 163840,
    vision: false,
  },
  "deepseek/deepseek-r1": { in: 0.3, out: 1.2, context: 163840, vision: false },
  "deepseek/deepseek-r1-distill-qwen-32b": {
    in: 0.24,
    out: 0.24,
    context: 64000,
    vision: false,
  },
  "deepseek/deepseek-r1-distill-qwen-14b": {
    in: 0.12,
    out: 0.12,
    context: 32768,
    vision: false,
  },
  "deepseek/deepseek-r1-distill-llama-70b": {
    in: 0.03,
    out: 0.13,
    context: 131072,
    vision: false,
  },
  "deepseek/deepseek-prover-v2": {
    in: 0.5,
    out: 2.18,
    context: 163840,
    vision: false,
  },
  "meta-llama/llama-guard-4-12b": {
    in: 0.18,
    out: 0.18,
    context: 163840,
    vision: true,
  },
  "meta-llama/llama-4-maverick": {
    in: 0.15,
    out: 0.6,
    context: 1048576,
    vision: true,
  },
  "meta-llama/llama-4-scout": {
    in: 0.08,
    out: 0.3,
    context: 327680,
    vision: true,
  },
  "meta-llama/llama-3.2-90b-vision-instruct": {
    in: 0.35,
    out: 0.4,
    context: 32768,
    vision: true,
  },
  "meta-llama/llama-3.2-11b-vision-instruct": {
    in: 0.049,
    out: 0.049,
    context: 131072,
    vision: true,
  },
  "meta-llama/llama-3.1-405b": { in: 4, out: 4, context: 32768, vision: false },
  "meta-llama/llama-3.1-405b-instruct": {
    in: 3.5,
    out: 3.5,
    context: 130815,
    vision: false,
  },
  "meta-llama/llama-3.1-405b-instruct:free": {
    in: 0,
    out: 0,
    context: 131072,
    vision: false,
  },
  "meta-llama/llama-3.1-70b-instruct": {
    in: 0.4,
    out: 0.4,
    context: 131072,
    vision: false,
  },
  "meta-llama/llama-3-70b-instruct": {
    in: 0.3,
    out: 0.4,
    context: 8192,
    vision: false,
  },
  "meta-llama/llama-3.3-70b-instruct": {
    in: 0.1,
    out: 0.32,
    context: 131072,
    vision: false,
  },
  "meta-llama/llama-3.3-70b-instruct:free": {
    in: 0,
    out: 0,
    context: 131072,
    vision: false,
  },
  "meta-llama/llama-guard-2-8b": {
    in: 0.2,
    out: 0.2,
    context: 8192,
    vision: false,
  },
  "meta-llama/llama-guard-3-8b": {
    in: 0.02,
    out: 0.06,
    context: 131072,
    vision: false,
  },
  "meta-llama/llama-3-8b-instruct": {
    in: 0.03,
    out: 0.06,
    context: 8192,
    vision: false,
  },
  "meta-llama/llama-3.1-8b-instruct": {
    in: 0.02,
    out: 0.03,
    context: 131072,
    vision: false,
  },
  "meta-llama/llama-3.2-1b-instruct": {
    in: 0.027,
    out: 0.2,
    context: 60000,
    vision: false,
  },
  "meta-llama/llama-3.2-3b-instruct": {
    in: 0.02,
    out: 0.02,
    context: 131072,
    vision: false,
  },
  "meta-llama/llama-3.2-3b-instruct:free": {
    in: 0,
    out: 0,
    context: 131072,
    vision: false,
  },
  "mistralai/mistral-large-2512": {
    in: 0.5,
    out: 1.5,
    context: 262144,
    vision: true,
  },
  "mistralai/mistral-medium-3.1": {
    in: 0.4,
    out: 2,
    context: 131072,
    vision: true,
  },
  "mistralai/mistral-medium-3": {
    in: 0.4,
    out: 2,
    context: 131072,
    vision: true,
  },
  "mistralai/ministral-14b-2512": {
    in: 0.2,
    out: 0.2,
    context: 262144,
    vision: true,
  },
  "mistralai/ministral-8b-2512": {
    in: 0.15,
    out: 0.15,
    context: 262144,
    vision: true,
  },
  "mistralai/ministral-3b-2512": {
    in: 0.1,
    out: 0.1,
    context: 131072,
    vision: true,
  },
  "mistralai/mistral-small-3.2-24b-instruct": {
    in: 0.06,
    out: 0.18,
    context: 131072,
    vision: true,
  },
  "mistralai/mistral-small-3.1-24b-instruct": {
    in: 0.03,
    out: 0.11,
    context: 131072,
    vision: true,
  },
  "mistralai/pixtral-large-2411": {
    in: 2,
    out: 6,
    context: 131072,
    vision: true,
  },
  "mistralai/pixtral-12b": { in: 0.1, out: 0.1, context: 32768, vision: true },
  "mistralai/mistral-small-3.1-24b-instruct:free": {
    in: 0,
    out: 0,
    context: 128000,
    vision: true,
  },
  "mistralai/mistral-large-2411": {
    in: 2,
    out: 6,
    context: 131072,
    vision: false,
  },
  "mistralai/mistral-large-2407": {
    in: 2,
    out: 6,
    context: 131072,
    vision: false,
  },
  "mistralai/mistral-large": { in: 2, out: 6, context: 128000, vision: false },
  "mistralai/mixtral-8x22b-instruct": {
    in: 2,
    out: 6,
    context: 65536,
    vision: false,
  },
  "mistralai/mixtral-8x7b-instruct": {
    in: 0.54,
    out: 0.54,
    context: 32768,
    vision: false,
  },
  "mistralai/devstral-medium": {
    in: 0.4,
    out: 2,
    context: 131072,
    vision: false,
  },
  "mistralai/codestral-2508": {
    in: 0.3,
    out: 0.9,
    context: 256000,
    vision: false,
  },
  "mistralai/mistral-tiny": {
    in: 0.25,
    out: 0.25,
    context: 32768,
    vision: false,
  },
  "mistralai/mistral-7b-instruct-v0.3": {
    in: 0.2,
    out: 0.2,
    context: 32768,
    vision: false,
  },
  "mistralai/mistral-7b-instruct-v0.2": {
    in: 0.2,
    out: 0.2,
    context: 32768,
    vision: false,
  },
  "mistralai/mistral-saba": {
    in: 0.2,
    out: 0.6,
    context: 32768,
    vision: false,
  },
  "mistralai/mistral-7b-instruct-v0.1": {
    in: 0.11,
    out: 0.19,
    context: 2824,
    vision: false,
  },
  "mistralai/voxtral-small-24b-2507": {
    in: 0.1,
    out: 0.3,
    context: 32000,
    vision: false,
  },
  "mistralai/ministral-8b": {
    in: 0.1,
    out: 0.1,
    context: 131072,
    vision: false,
  },
  "mistralai/mistral-small-creative": {
    in: 0.1,
    out: 0.3,
    context: 32768,
    vision: false,
  },
  "mistralai/devstral-small": {
    in: 0.07,
    out: 0.28,
    context: 128000,
    vision: false,
  },
  "mistralai/devstral-small-2505": {
    in: 0.06,
    out: 0.12,
    context: 128000,
    vision: false,
  },
  "mistralai/devstral-2512": {
    in: 0.05,
    out: 0.22,
    context: 262144,
    vision: false,
  },
  "mistralai/ministral-3b": {
    in: 0.04,
    out: 0.04,
    context: 131072,
    vision: false,
  },
  "mistralai/mistral-small-24b-instruct-2501": {
    in: 0.03,
    out: 0.11,
    context: 32768,
    vision: false,
  },
  "mistralai/mistral-7b-instruct": {
    in: 0.028,
    out: 0.054,
    context: 32768,
    vision: false,
  },
  "mistralai/mistral-nemo": {
    in: 0.02,
    out: 0.04,
    context: 131072,
    vision: false,
  },
  "mistralai/devstral-2512:free": {
    in: 0,
    out: 0,
    context: 262144,
    vision: false,
  },
  "mistralai/mistral-7b-instruct:free": {
    in: 0,
    out: 0,
    context: 32768,
    vision: false,
  },
  "openai/gpt-5.2-pro": { in: 21, out: 168, context: 400000, vision: true },
  "openai/gpt-5.2": { in: 1.75, out: 14, context: 400000, vision: true },
  "openai/gpt-5.2-chat": { in: 1.75, out: 14, context: 128000, vision: true },
  "openai/gpt-5.1-codex-max": {
    in: 1.25,
    out: 10,
    context: 400000,
    vision: true,
  },
  "openai/gpt-5.1": { in: 1.25, out: 10, context: 400000, vision: true },
  "openai/gpt-5.1-chat": { in: 1.25, out: 10, context: 128000, vision: true },
  "openai/gpt-5.1-codex": { in: 1.25, out: 10, context: 400000, vision: true },
  "openai/gpt-5.1-codex-mini": {
    in: 0.25,
    out: 2,
    context: 400000,
    vision: true,
  },
  "openai/gpt-oss-safeguard-20b": {
    in: 0.075,
    out: 0.3,
    context: 131072,
    vision: false,
  },
  "openai/gpt-5-image-mini": { in: 2.5, out: 2, context: 400000, vision: true },
  "openai/gpt-5-image": { in: 10, out: 10, context: 400000, vision: true },
  "openai/o3-deep-research": { in: 10, out: 40, context: 200000, vision: true },
  "openai/o4-mini-deep-research": {
    in: 2,
    out: 8,
    context: 200000,
    vision: true,
  },
  "openai/gpt-5-pro": { in: 15, out: 120, context: 400000, vision: true },
  "openai/gpt-5-codex": { in: 1.25, out: 10, context: 400000, vision: true },
  "openai/gpt-4o-audio-preview": {
    in: 2.5,
    out: 10,
    context: 128000,
    vision: true,
  },
  "openai/gpt-5-chat": { in: 1.25, out: 10, context: 128000, vision: true },
  "openai/gpt-5": { in: 1.25, out: 10, context: 400000, vision: true },
  "openai/gpt-5-mini": { in: 0.25, out: 2, context: 400000, vision: true },
  "openai/gpt-5-nano": { in: 0.05, out: 0.4, context: 400000, vision: true },
  "openai/gpt-oss-120b:free": { in: 0, out: 0, context: 131072, vision: false },
  "openai/gpt-oss-120b": {
    in: 0.039,
    out: 0.19,
    context: 131072,
    vision: false,
  },
  "openai/gpt-oss-120b:exacto": {
    in: 0.039,
    out: 0.19,
    context: 131072,
    vision: false,
  },
  "openai/gpt-oss-20b:free": { in: 0, out: 0, context: 131072, vision: false },
  "openai/gpt-oss-20b": { in: 0.03, out: 0.14, context: 131072, vision: false },
  "openai/o3-pro": { in: 20, out: 80, context: 200000, vision: true },
  "openai/codex-mini": { in: 1.5, out: 6, context: 200000, vision: true },
  "openai/o4-mini-high": { in: 1.1, out: 4.4, context: 200000, vision: true },
  "openai/o3": { in: 2, out: 8, context: 200000, vision: true },
  "openai/o4-mini": { in: 1.1, out: 4.4, context: 200000, vision: true },
  "openai/gpt-4.1": { in: 2, out: 8, context: 1047576, vision: true },
  "openai/gpt-4.1-mini": { in: 0.4, out: 1.6, context: 1047576, vision: true },
  "openai/gpt-4.1-nano": { in: 0.1, out: 0.4, context: 1047576, vision: true },
  "openai/o1-pro": { in: 150, out: 600, context: 200000, vision: true },
  "openai/o3-mini-high": { in: 1.1, out: 4.4, context: 200000, vision: false },
  "openai/o3-mini": { in: 1.1, out: 4.4, context: 200000, vision: false },
  "openai/o1": { in: 15, out: 60, context: 200000, vision: true },
  "openai/gpt-4o-mini-search-preview": {
    in: 0.15,
    out: 0.6,
    context: 128000,
    vision: false,
  },
  "openai/gpt-4o-search-preview": {
    in: 2.5,
    out: 10,
    context: 128000,
    vision: false,
  },
  "openai/gpt-4-turbo": { in: 10, out: 30, context: 128000, vision: true },
  "openai/gpt-3.5-turbo-0613": { in: 1, out: 2, context: 4095, vision: false },
  "openai/gpt-4-turbo-preview": {
    in: 10,
    out: 30,
    context: 128000,
    vision: false,
  },
  "openai/gpt-4-1106-preview": {
    in: 10,
    out: 30,
    context: 128000,
    vision: false,
  },
  "openai/gpt-3.5-turbo-instruct": {
    in: 1.5,
    out: 2,
    context: 4095,
    vision: false,
  },
  "openai/gpt-3.5-turbo-16k": { in: 3, out: 4, context: 16385, vision: false },
  "openai/gpt-4-0314": { in: 30, out: 60, context: 8191, vision: false },
  "openai/gpt-4": { in: 30, out: 60, context: 8191, vision: false },
  "openai/gpt-3.5-turbo": { in: 0.5, out: 1.5, context: 16385, vision: false },
  "openai/gpt-4o-2024-11-20": {
    in: 2.5,
    out: 10,
    context: 128000,
    vision: true,
  },
  "openai/chatgpt-4o-latest": { in: 5, out: 15, context: 128000, vision: true },
  "openai/gpt-4o-2024-08-06": {
    in: 2.5,
    out: 10,
    context: 128000,
    vision: true,
  },
  "openai/gpt-4o-mini-2024-07-18": {
    in: 0.15,
    out: 0.6,
    context: 128000,
    vision: true,
  },
  "openai/gpt-4o-mini": { in: 0.15, out: 0.6, context: 128000, vision: true },
  "openai/gpt-4o-2024-05-13": { in: 5, out: 15, context: 128000, vision: true },
  "openai/gpt-4o": { in: 2.5, out: 10, context: 128000, vision: true },
  "openai/gpt-4o:extended": { in: 6, out: 18, context: 128000, vision: true },
  "anthropic/claude-opus-4.5": { in: 5, out: 25, context: 200000 },
  "anthropic/claude-haiku-4.5": { in: 1, out: 5, context: 200000 },
  "anthropic/claude-sonnet-4.5": { in: 3, out: 15, context: 1000000 },
  "anthropic/claude-opus-4.1": { in: 15, out: 75, context: 200000 },
  "anthropic/claude-opus-4": { in: 15, out: 75, context: 200000 },
  "anthropic/claude-sonnet-4": { in: 3, out: 15, context: 1000000 },
  "anthropic/claude-3.7-sonnet": { in: 3, out: 15, context: 200000 },
  "anthropic/claude-3.5-haiku": { in: 0.8, out: 4, context: 200000 },
  "anthropic/claude-3.5-sonnet": { in: 6, out: 30, context: 200000 },
  "anthropic/claude-3-haiku": { in: 0.25, out: 1.25, context: 200000 },
  "anthropic/claude-3-opus": { in: 15, out: 75, context: 200000 },
  "google/gemini-3-flash-preview": {
    in: 0.5,
    out: 3,
    context: 1048576,
    vision: true,
  },
  "google/gemini-3-pro-image-preview": {
    in: 2,
    out: 12,
    context: 65536,
    vision: true,
  },
  "google/gemini-3-pro-preview": {
    in: 2,
    out: 12,
    context: 1048576,
    vision: true,
  },
  "google/gemini-2.5-pro": {
    in: 1.25,
    out: 10,
    context: 1048576,
    vision: true,
  },
  "google/gemini-2.5-flash": {
    in: 0.3,
    out: 2.5,
    context: 1048576,
    vision: true,
  },
  "google/gemini-2.5-flash-image": {
    in: 0.3,
    out: 2.5,
    context: 32768,
    vision: true,
  },
  "google/gemini-2.5-flash-lite": {
    in: 0.1,
    out: 0.4,
    context: 1048576,
    vision: true,
  },
  "google/gemini-2.0-flash-001": {
    in: 0.1,
    out: 0.4,
    context: 1048576,
    vision: true,
  },
  "google/gemini-2.0-flash-lite-001": {
    in: 0.075,
    out: 0.3,
    context: 1048576,
    vision: true,
  },
  "google/gemini-2.0-flash-exp:free": {
    in: 0,
    out: 0,
    context: 1048576,
    vision: true,
  },
  "google/gemma-3-27b-it": {
    in: 0.04,
    out: 0.15,
    context: 96000,
    vision: true,
  },
  "google/gemma-3-27b-it:free": {
    in: 0,
    out: 0,
    context: 131072,
    vision: true,
  },
  "google/gemma-3-12b-it": {
    in: 0.03,
    out: 0.1,
    context: 131072,
    vision: true,
  },
  "google/gemma-3-12b-it:free": { in: 0, out: 0, context: 32768, vision: true },
  "google/gemma-3-4b-it": {
    in: 0.01703,
    out: 0.06815,
    context: 96000,
    vision: true,
  },
  "google/gemma-3-4b-it:free": { in: 0, out: 0, context: 32768, vision: true },
  "google/gemma-3n-e4b-it": {
    in: 0.02,
    out: 0.04,
    context: 32768,
    vision: false,
  },
  "google/gemma-3n-e4b-it:free": {
    in: 0,
    out: 0,
    context: 8192,
    vision: false,
  },
  "google/gemma-3n-e2b-it:free": {
    in: 0,
    out: 0,
    context: 8192,
    vision: false,
  },
  "google/gemma-2-27b-it": {
    in: 0.65,
    out: 0.65,
    context: 8192,
    vision: false,
  },
  "google/gemma-2-9b-it": { in: 0.03, out: 0.09, context: 8192, vision: false },
  "qwen/qwen3-vl-32b-instruct": {
    in: 0.5,
    out: 1.5,
    context: 262144,
    vision: true,
  },
  "qwen/qwen3-vl-8b-thinking": {
    in: 0.18,
    out: 2.1,
    context: 256000,
    vision: true,
  },
  "qwen/qwen3-vl-8b-instruct": {
    in: 0.064,
    out: 0.4,
    context: 131072,
    vision: true,
  },
  "qwen/qwen3-vl-30b-a3b-thinking": {
    in: 0.16,
    out: 0.8,
    context: 131072,
    vision: true,
  },
  "qwen/qwen3-vl-30b-a3b-instruct": {
    in: 0.15,
    out: 0.6,
    context: 262144,
    vision: true,
  },
  "qwen/qwen3-vl-235b-a22b-thinking": {
    in: 0.3,
    out: 1.2,
    context: 262144,
    vision: true,
  },
  "qwen/qwen3-vl-235b-a22b-instruct": {
    in: 0.2,
    out: 1.2,
    context: 262144,
    vision: true,
  },
  "qwen/qwen3-max": { in: 1.2, out: 6, context: 256000, vision: false },
  "qwen/qwen3-coder-plus": { in: 1, out: 5, context: 128000, vision: false },
  "qwen/qwen3-coder-flash": {
    in: 0.3,
    out: 1.5,
    context: 128000,
    vision: false,
  },
  "qwen/qwen3-next-80b-a3b-thinking": {
    in: 0.12,
    out: 1.2,
    context: 131072,
    vision: false,
  },
  "qwen/qwen3-next-80b-a3b-instruct": {
    in: 0.09,
    out: 1.1,
    context: 262144,
    vision: false,
  },
  "qwen/qwen-plus-2025-07-28": {
    in: 0.4,
    out: 1.2,
    context: 1000000,
    vision: false,
  },
  "qwen/qwen-plus-2025-07-28:thinking": {
    in: 0.4,
    out: 4,
    context: 1000000,
    vision: false,
  },
  "qwen/qwen3-30b-a3b-thinking-2507": {
    in: 0.051,
    out: 0.34,
    context: 32768,
    vision: false,
  },
  "qwen/qwen3-coder-30b-a3b-instruct": {
    in: 0.07,
    out: 0.27,
    context: 160000,
    vision: false,
  },
  "qwen/qwen3-30b-a3b-instruct-2507": {
    in: 0.08,
    out: 0.33,
    context: 262144,
    vision: false,
  },
  "qwen/qwen3-235b-a22b-thinking-2507": {
    in: 0.11,
    out: 0.6,
    context: 262144,
    vision: false,
  },
  "qwen/qwen3-coder:free": { in: 0, out: 0, context: 262000, vision: false },
  "qwen/qwen3-coder": { in: 0.22, out: 0.95, context: 262144, vision: false },
  "qwen/qwen3-coder:exacto": {
    in: 0.22,
    out: 1.8,
    context: 262144,
    vision: false,
  },
  "qwen/qwen3-235b-a22b-2507": {
    in: 0.071,
    out: 0.463,
    context: 262144,
    vision: false,
  },
  "qwen/qwen3-4b:free": { in: 0, out: 0, context: 40960, vision: false },
  "qwen/qwen3-30b-a3b": { in: 0.06, out: 0.22, context: 40960, vision: false },
  "qwen/qwen3-8b": { in: 0.028, out: 0.1104, context: 128000, vision: false },
  "qwen/qwen3-14b": { in: 0.05, out: 0.22, context: 40960, vision: false },
  "qwen/qwen3-32b": { in: 0.08, out: 0.24, context: 40960, vision: false },
  "qwen/qwen3-235b-a22b": {
    in: 0.18,
    out: 0.54,
    context: 40960,
    vision: false,
  },
  "qwen/qwen2.5-coder-7b-instruct": {
    in: 0.03,
    out: 0.09,
    context: 32768,
    vision: false,
  },
  "qwen/qwen2.5-vl-32b-instruct": {
    in: 0.05,
    out: 0.22,
    context: 16384,
    vision: true,
  },
  "qwen/qwq-32b": { in: 0.15, out: 0.4, context: 32768, vision: false },
  "qwen/qwen-vl-plus": { in: 0.21, out: 0.63, context: 7500, vision: true },
  "qwen/qwen-vl-max": { in: 0.8, out: 3.2, context: 131072, vision: true },
  "qwen/qwen-turbo": { in: 0.05, out: 0.2, context: 1000000, vision: false },
  "qwen/qwen2.5-vl-72b-instruct": {
    in: 0.07,
    out: 0.26,
    context: 32768,
    vision: true,
  },
  "qwen/qwen-plus": { in: 0.4, out: 1.2, context: 131072, vision: false },
  "qwen/qwen-max": { in: 1.6, out: 6.4, context: 32768, vision: false },
  "qwen/qwen-2.5-coder-32b-instruct": {
    in: 0.03,
    out: 0.11,
    context: 32768,
    vision: false,
  },
  "qwen/qwen-2.5-7b-instruct": {
    in: 0.04,
    out: 0.1,
    context: 32768,
    vision: false,
  },
  "qwen/qwen-2.5-72b-instruct": {
    in: 0.12,
    out: 0.39,
    context: 32768,
    vision: false,
  },
  "qwen/qwen-2.5-vl-7b-instruct:free": {
    in: 0,
    out: 0,
    context: 32768,
    vision: true,
  },
  "qwen/qwen-2.5-vl-7b-instruct": {
    in: 0.2,
    out: 0.2,
    context: 32768,
    vision: true,
  },
  // Amazon Nova
  "amazon/nova-2-lite-v1:free": {
    in: 0,
    out: 0,
    context: 1000000,
    vision: true,
  },
  "amazon/nova-2-lite-v1": {
    in: 0.3,
    out: 2.5,
    context: 1000000,
    vision: true,
  },
  "amazon/nova-premier-v1": {
    in: 2.5,
    out: 12.5,
    context: 1000000,
    vision: true,
  },
  "amazon/nova-lite-v1": { in: 0.06, out: 0.24, context: 300000, vision: true },
  "amazon/nova-micro-v1": {
    in: 0.035,
    out: 0.14,
    context: 128000,
    vision: false,
  },
  "amazon/nova-pro-v1": { in: 0.8, out: 3.2, context: 300000, vision: true },

  // Perplexity
  "perplexity/sonar-pro-search": {
    in: 3,
    out: 15,
    context: 200000,
    vision: true,
  },
  "perplexity/sonar-pro": { in: 3, out: 15, context: 200000, vision: true },
  "perplexity/sonar-reasoning-pro": {
    in: 2,
    out: 8,
    context: 128000,
    vision: true,
  },
  "perplexity/sonar-reasoning": {
    in: 1,
    out: 5,
    context: 127000,
    vision: false,
  },
  "perplexity/sonar": { in: 1, out: 1, context: 127072, vision: true },
  "perplexity/sonar-deep-research": {
    in: 2,
    out: 8,
    context: 128000,
    vision: true,
  },

  // Z.AI (Zhipu) GLM models
  "z-ai/glm-4.7": { in: 0.44, out: 1.74, context: 202752, vision: false },
  "z-ai/glm-4.6v": { in: 0.3, out: 0.9, context: 131072, vision: true },
  "z-ai/glm-4.6": { in: 0.39, out: 1.9, context: 204800, vision: false },
  "z-ai/glm-4.6:exacto": {
    in: 0.44,
    out: 1.76,
    context: 204800,
    vision: false,
  },
  "z-ai/glm-4.5v": { in: 0.48, out: 1.44, context: 65536, vision: true },
  "z-ai/glm-4.5": { in: 0.35, out: 1.55, context: 131072, vision: false },
  "z-ai/glm-4.5-air:free": { in: 0, out: 0, context: 131072, vision: false },
  "z-ai/glm-4.5-air": { in: 0.104, out: 0.68, context: 131072, vision: false },
  "z-ai/glm-4-32b": { in: 0.1, out: 0.1, context: 128000, vision: false },

  // NVIDIA
  "nvidia/nemotron-3-nano-30b-a3b:free": {
    in: 0,
    out: 0,
    context: 256000,
    vision: false,
  },
  "nvidia/nemotron-3-nano-30b-a3b": {
    in: 0.06,
    out: 0.24,
    context: 262144,
    vision: false,
  },
  "nvidia/nemotron-nano-12b-v2-vl:free": {
    in: 0,
    out: 0,
    context: 128000,
    vision: true,
  },
  "nvidia/nemotron-nano-12b-v2-vl": {
    in: 0.2,
    out: 0.6,
    context: 131072,
    vision: true,
  },
  "nvidia/nemotron-nano-9b-v2:free": {
    in: 0,
    out: 0,
    context: 128000,
    vision: false,
  },
  "nvidia/nemotron-nano-9b-v2": {
    in: 0.04,
    out: 0.16,
    context: 131072,
    vision: false,
  },
  "nvidia/llama-3.3-nemotron-super-49b-v1.5": {
    in: 0.1,
    out: 0.4,
    context: 131072,
    vision: false,
  },
  "nvidia/llama-3.1-nemotron-ultra-253b-v1": {
    in: 0.6,
    out: 1.8,
    context: 131072,
    vision: false,
  },
  "nvidia/llama-3.1-nemotron-70b-instruct": {
    in: 1.2,
    out: 1.2,
    context: 131072,
    vision: false,
  },

  // Baidu ERNIE
  "baidu/ernie-4.5-21b-a3b-thinking": {
    in: 0.056,
    out: 0.224,
    context: 131072,
    vision: false,
  },
  "baidu/ernie-4.5-21b-a3b": {
    in: 0.056,
    out: 0.224,
    context: 120000,
    vision: false,
  },
  "baidu/ernie-4.5-vl-28b-a3b": {
    in: 0.112,
    out: 0.448,
    context: 30000,
    vision: true,
  },
  "baidu/ernie-4.5-vl-424b-a47b": {
    in: 0.336,
    out: 1,
    context: 123000,
    vision: true,
  },
  "baidu/ernie-4.5-300b-a47b": {
    in: 0.224,
    out: 0.88,
    context: 123000,
    vision: false,
  },

  // Nous Research
  "nousresearch/hermes-4-70b": {
    in: 0.11,
    out: 0.38,
    context: 131072,
    vision: false,
  },
  "nousresearch/hermes-4-405b": {
    in: 0.3,
    out: 1.2,
    context: 131072,
    vision: false,
  },
  "nousresearch/hermes-3-llama-3.1-70b": {
    in: 0.3,
    out: 0.3,
    context: 65536,
    vision: false,
  },
  "nousresearch/hermes-3-llama-3.1-405b:free": {
    in: 0,
    out: 0,
    context: 131072,
    vision: false,
  },
  "nousresearch/hermes-3-llama-3.1-405b": {
    in: 1,
    out: 1,
    context: 131072,
    vision: false,
  },
  "nousresearch/deephermes-3-mistral-24b-preview": {
    in: 0.02,
    out: 0.1,
    context: 32768,
    vision: false,
  },
  "nousresearch/hermes-2-pro-llama-3-8b": {
    in: 0.025,
    out: 0.08,
    context: 8192,
    vision: false,
  },

  // Microsoft
  "microsoft/phi-4-reasoning-plus": {
    in: 0.07,
    out: 0.35,
    context: 32768,
    vision: false,
  },
  "microsoft/phi-4-multimodal-instruct": {
    in: 0.05,
    out: 0.1,
    context: 131072,
    vision: true,
  },
  "microsoft/phi-4": { in: 0.06, out: 0.14, context: 16384, vision: false },
  "microsoft/phi-3.5-mini-128k-instruct": {
    in: 0.1,
    out: 0.1,
    context: 128000,
    vision: false,
  },
  "microsoft/phi-3-mini-128k-instruct": {
    in: 0.1,
    out: 0.1,
    context: 128000,
    vision: false,
  },
  "microsoft/phi-3-medium-128k-instruct": {
    in: 1,
    out: 1,
    context: 128000,
    vision: false,
  },
  "microsoft/mai-ds-r1": { in: 0.3, out: 1.2, context: 163840, vision: false },
  "microsoft/wizardlm-2-8x22b": {
    in: 0.48,
    out: 0.48,
    context: 65536,
    vision: false,
  },

  // Cohere
  "cohere/command-a": { in: 2.5, out: 10, context: 256000, vision: false },
  "cohere/command-r7b-12-2024": {
    in: 0.0375,
    out: 0.15,
    context: 128000,
    vision: false,
  },
  "cohere/command-r-08-2024": {
    in: 0.15,
    out: 0.6,
    context: 128000,
    vision: false,
  },
  "cohere/command-r-plus-08-2024": {
    in: 2.5,
    out: 10,
    context: 128000,
    vision: false,
  },

  // MoonshotAI Kimi
  "moonshotai/kimi-linear-48b-a3b-instruct": {
    in: 0.7,
    out: 0.9,
    context: 1048576,
    vision: false,
  },
  "moonshotai/kimi-k2-thinking": {
    in: 0.4,
    out: 1.75,
    context: 262144,
    vision: false,
  },
  "moonshotai/kimi-k2-0905": {
    in: 0.39,
    out: 1.9,
    context: 262144,
    vision: false,
  },
  "moonshotai/kimi-k2-0905:exacto": {
    in: 0.6,
    out: 2.5,
    context: 262144,
    vision: false,
  },
  "moonshotai/kimi-k2:free": { in: 0, out: 0, context: 32768, vision: false },
  "moonshotai/kimi-k2": {
    in: 0.456,
    out: 1.84,
    context: 131072,
    vision: false,
  },
  "moonshotai/kimi-dev-72b": {
    in: 0.29,
    out: 1.15,
    context: 131072,
    vision: false,
  },

  // Alibaba Tongyi
  "alibaba/tongyi-deepresearch-30b-a3b:free": {
    in: 0,
    out: 0,
    context: 131072,
    vision: false,
  },
  "alibaba/tongyi-deepresearch-30b-a3b": {
    in: 0.09,
    out: 0.4,
    context: 131072,
    vision: false,
  },

  // Relace
  "relace/relace-search": { in: 1, out: 3, context: 256000, vision: false },
  "relace/relace-apply-3": {
    in: 0.85,
    out: 1.25,
    context: 256000,
    vision: false,
  },

  // EssentialAI
  "essentialai/rnj-1-instruct": {
    in: 0.15,
    out: 0.15,
    context: 32768,
    vision: false,
  },

  // Arcee AI
  "arcee-ai/trinity-mini:free": {
    in: 0,
    out: 0,
    context: 131072,
    vision: false,
  },
  "arcee-ai/trinity-mini": {
    in: 0.045,
    out: 0.15,
    context: 131072,
    vision: false,
  },
  "arcee-ai/spotlight": { in: 0.18, out: 0.18, context: 131072, vision: true },
  "arcee-ai/maestro-reasoning": {
    in: 0.9,
    out: 3.3,
    context: 131072,
    vision: false,
  },
  "arcee-ai/virtuoso-large": {
    in: 0.75,
    out: 1.2,
    context: 131072,
    vision: false,
  },
  "arcee-ai/coder-large": { in: 0.5, out: 0.8, context: 32768, vision: false },

  // Prime Intellect
  "prime-intellect/intellect-3": {
    in: 0.2,
    out: 1.1,
    context: 131072,
    vision: false,
  },

  // TNG Tech
  "tngtech/tng-r1t-chimera:free": {
    in: 0,
    out: 0,
    context: 163840,
    vision: false,
  },
  "tngtech/tng-r1t-chimera": {
    in: 0.3,
    out: 1.2,
    context: 163840,
    vision: false,
  },
  "tngtech/deepseek-r1t2-chimera:free": {
    in: 0,
    out: 0,
    context: 163840,
    vision: false,
  },
  "tngtech/deepseek-r1t2-chimera": {
    in: 0.3,
    out: 1.2,
    context: 163840,
    vision: false,
  },
  "tngtech/deepseek-r1t-chimera:free": {
    in: 0,
    out: 0,
    context: 163840,
    vision: false,
  },
  "tngtech/deepseek-r1t-chimera": {
    in: 0.3,
    out: 1.2,
    context: 163840,
    vision: false,
  },

  // Deep Cogito
  "deepcogito/cogito-v2.1-671b": {
    in: 1.25,
    out: 1.25,
    context: 128000,
    vision: false,
  },
  "deepcogito/cogito-v2-preview-llama-405b": {
    in: 3.5,
    out: 3.5,
    context: 32768,
    vision: false,
  },
  "deepcogito/cogito-v2-preview-llama-70b": {
    in: 0.88,
    out: 0.88,
    context: 32768,
    vision: false,
  },
  "deepcogito/cogito-v2-preview-llama-109b-moe": {
    in: 0.18,
    out: 0.59,
    context: 32767,
    vision: true,
  },

  // StepFun
  "stepfun-ai/step3": { in: 0.57, out: 1.42, context: 65536, vision: true },

  // OpenGVLab
  "opengvlab/internvl3-78b": {
    in: 0.1,
    out: 0.39,
    context: 32768,
    vision: true,
  },

  // TheDrummer
  "thedrummer/cydonia-24b-v4.1": {
    in: 0.3,
    out: 0.5,
    context: 131072,
    vision: false,
  },
  "thedrummer/anubis-70b-v1.1": {
    in: 0.75,
    out: 1,
    context: 131072,
    vision: false,
  },
  "thedrummer/skyfall-36b-v2": {
    in: 0.55,
    out: 0.8,
    context: 32768,
    vision: false,
  },
  "thedrummer/unslopnemo-12b": {
    in: 0.4,
    out: 0.4,
    context: 32768,
    vision: false,
  },
  "thedrummer/rocinante-12b": {
    in: 0.17,
    out: 0.43,
    context: 32768,
    vision: false,
  },

  // Kwaipilot
  "kwaipilot/kat-coder-pro:free": {
    in: 0,
    out: 0,
    context: 256000,
    vision: false,
  },

  // MiniMax
  "minimax/minimax-m2": { in: 0.2, out: 1, context: 196608, vision: false },
  "minimax/minimax-m1": { in: 0.4, out: 2.2, context: 1000000, vision: false },
  "minimax/minimax-01": { in: 0.2, out: 1.1, context: 1000192, vision: true },

  // LiquidAI
  "liquid/lfm2-8b-a1b": { in: 0.05, out: 0.1, context: 32768, vision: false },
  "liquid/lfm-2.2-6b": { in: 0.05, out: 0.1, context: 32768, vision: false },

  // IBM Granite
  "ibm-granite/granite-4.0-h-micro": {
    in: 0.017,
    out: 0.11,
    context: 131000,
    vision: false,
  },

  // AllenAI Olmo
  "allenai/olmo-3.1-32b-think:free": {
    in: 0,
    out: 0,
    context: 65536,
    vision: false,
  },
  "allenai/olmo-3-32b-think:free": {
    in: 0,
    out: 0,
    context: 65536,
    vision: false,
  },
  "allenai/olmo-3-7b-instruct": {
    in: 0.1,
    out: 0.2,
    context: 65536,
    vision: false,
  },
  "allenai/olmo-3-7b-think": {
    in: 0.12,
    out: 0.2,
    context: 65536,
    vision: false,
  },
  "allenai/olmo-2-0325-32b-instruct": {
    in: 0.05,
    out: 0.2,
    context: 128000,
    vision: false,
  },

  // THUDM
  "thudm/glm-4.1v-9b-thinking": {
    in: 0.028,
    out: 0.1104,
    context: 65536,
    vision: true,
  },

  // Meituan
  "meituan/longcat-flash-chat:free": {
    in: 0,
    out: 0,
    context: 131072,
    vision: false,
  },
  "meituan/longcat-flash-chat": {
    in: 0.2,
    out: 0.8,
    context: 131072,
    vision: false,
  },

  // Tencent Hunyuan
  "tencent/hunyuan-a13b-instruct": {
    in: 0.14,
    out: 0.57,
    context: 131072,
    vision: false,
  },

  // ByteDance
  "bytedance/ui-tars-1.5-7b": {
    in: 0.1,
    out: 0.2,
    context: 128000,
    vision: true,
  },

  // Venice (Dolphin)
  "cognitivecomputations/dolphin-mistral-24b-venice-edition:free": {
    in: 0,
    out: 0,
    context: 32768,
    vision: false,
  },

  // Switchpoint
  "switchpoint/router": { in: 0.85, out: 3.4, context: 131072, vision: false },

  // Morph
  "morph/morph-v3-large": { in: 0.9, out: 1.9, context: 262144, vision: false },
  "morph/morph-v3-fast": { in: 0.8, out: 1.2, context: 81920, vision: false },

  // Inception
  "inception/mercury": { in: 0.25, out: 1, context: 128000, vision: false },
  "inception/mercury-coder": {
    in: 0.25,
    out: 1,
    context: 128000,
    vision: false,
  },

  // Sao10K
  "sao10k/l3.1-70b-hanami-x1": { in: 3, out: 3, context: 16000, vision: false },
  "sao10k/l3.3-euryale-70b": {
    in: 0.65,
    out: 0.75,
    context: 131072,
    vision: false,
  },
  "sao10k/l3.1-euryale-70b": {
    in: 0.65,
    out: 0.75,
    context: 32768,
    vision: false,
  },
  "sao10k/l3-euryale-70b": {
    in: 1.48,
    out: 1.48,
    context: 8192,
    vision: false,
  },
  "sao10k/l3-lunaris-8b": { in: 0.04, out: 0.05, context: 8192, vision: false },

  // NeverSleep
  "neversleep/llama-3.1-lumimaid-8b": {
    in: 0.09,
    out: 0.6,
    context: 32768,
    vision: false,
  },
  "neversleep/noromaid-20b": { in: 1, out: 1.75, context: 4096, vision: false },

  // AionLabs
  "aion-labs/aion-1.0": { in: 4, out: 8, context: 131072, vision: false },
  "aion-labs/aion-1.0-mini": {
    in: 0.7,
    out: 1.4,
    context: 131072,
    vision: false,
  },
  "aion-labs/aion-rp-llama-3.1-8b": {
    in: 0.8,
    out: 1.6,
    context: 32768,
    vision: false,
  },

  // ArliAI
  "arliai/qwq-32b-arliai-rpr-v1": {
    in: 0.03,
    out: 0.11,
    context: 32768,
    vision: false,
  },

  // EleutherAI
  "eleutherai/llemma_7b": { in: 0.8, out: 1.2, context: 4096, vision: false },

  // AlfredPros
  "alfredpros/codellama-7b-instruct-solidity": {
    in: 0.8,
    out: 1.2,
    context: 4096,
    vision: false,
  },

  // Xiaomi
  "xiaomi/mimo-v2-flash:free": {
    in: 0,
    out: 0,
    context: 262144,
    vision: false,
  },

  // Nex AGI
  "nex-agi/deepseek-v3.1-nex-n1:free": {
    in: 0,
    out: 0,
    context: 131072,
    vision: false,
  },

  // Other legacy models
  "inflection/inflection-3-pi": {
    in: 2.5,
    out: 10,
    context: 8000,
    vision: false,
  },
  "inflection/inflection-3-productivity": {
    in: 2.5,
    out: 10,
    context: 8000,
    vision: false,
  },
  "anthracite-org/magnum-v4-72b": {
    in: 3,
    out: 5,
    context: 16384,
    vision: false,
  },
  "raifle/sorcererlm-8x22b": {
    in: 4.5,
    out: 4.5,
    context: 16000,
    vision: false,
  },
  "alpindale/goliath-120b": { in: 6, out: 8, context: 6144, vision: false },
  "mancer/weaver": { in: 0.75, out: 1, context: 8000, vision: false },
  "undi95/remm-slerp-l2-13b": {
    in: 0.45,
    out: 0.65,
    context: 6144,
    vision: false,
  },
  "gryphe/mythomax-l2-13b": {
    in: 0.06,
    out: 0.06,
    context: 4096,
    vision: false,
  },
};

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

  // Convert to base64
  const base64 = btoa(String.fromCharCode(...buffer));
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
