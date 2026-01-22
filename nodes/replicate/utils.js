import { repeat, throwError } from "../../utils/node.js";

export async function catchError(res) {
  if (!res.ok) {
    const errorText = await res.text();
    throwError.fatal(`Replicate API error ${res.status}: ${errorText}`);
  }
}

const BASE_URL = "https://api.replicate.com";

export class Replicate {
  apiToken;
  options;
  constructor(env, options = {}) {
    const { REPLICATE_TOKEN } = env.variables;
    if (!REPLICATE_TOKEN) {
      throwError.fatal("Please, set your API token for Replicate AI");
    }

    this.apiToken = REPLICATE_TOKEN;
    this.options = {
      version: "v1",
      checkInterval: 3_000,
      maxAttempts: 100,
      ...options,
    };
  }

  static userScope(env) {
    return env.scope.REPLICATE_TOKEN === "user";
  }

  async createTask(endpoint, payload) {
    const { version, checkInterval: delay } = this.options;
    const url = [BASE_URL, version, endpoint].join("/");
    console.log("Sending request to", url);
    console.log(JSON.stringify(payload, null, 2));
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: payload,
      }),
    });

    await catchError(res);
    const { id: task } = await res.json();
    return repeat({
      state: { task, createdAt: new Date().toISOString() },
      delay,
    });
  }

  async checkTask(state) {
    const { task, attempt = 0, startedAt } = state;

    const { version } = this.options;
    const url = [BASE_URL, version, `predictions/${task}`].join("/");
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
    });
    await catchError(res);

    const { status, error, output } = await res.json();
    switch (status) {
      case "starting":
      case "processing": {
        const { maxAttempts, checkInterval } = this.options;
        if (attempt >= maxAttempts) {
          const now = new Date();
          const time = (now - new Date(startedAt)) / 1_000;
          throwError.timeout(`Task ${task} timeout in ${time} sec`);
        }
        return {
          __repeat: repeat({
            state: { task, attempt: attempt + 1 },
            progress: {
              total: maxAttempts,
              processed: attempt,
            },
            delay: checkInterval,
          }),
        };
      }
      case "failed":
      case "canceled":
        throwError.fatal(error || "Generation failed");
        break;
      case "succeeded":
        return { output };
      default:
        throwError.fatal(`Unknown status: ${status}`);
    }
  }
}
