import { fal } from "npm:@fal-ai/client@1.2.0";
import { repeat, throwError } from "../../utils/node.js";

export class Fal {
  options;
  constructor(env, options = {}) {
    const { FAL_KEY } = env.variables;
    if (!FAL_KEY) {
      throwError.fatal("Please, set your key for Fal AI");
    }

    fal.config({ credentials: FAL_KEY });

    this.options = {
      checkInterval: 3_000,
      maxAttempts: 100,
      ...options,
    };
  }

  static userScope(env) {
    return env.scope.FAL_KEY === "user";
  }

  async createTask(endpoint, payload) {
    const { checkInterval: delay } = this.options;
    console.log("Sending request to", endpoint);
    console.log(JSON.stringify(payload, null, 2));

    const { request_id: task } = await fal.queue.submit(endpoint, payload);
    return repeat({
      state: { task, endpoint, createdAt: new Date().toISOString() },
      delay,
    });
  }

  async checkTask(state) {
    const { task, endpoint, attempt = 0, startedAt } = state;
    console.log(`Check task ${attempt} ${task} at ${endpoint}`);

    const { status } = await fal.queue.status(endpoint, {
      requestId: task,
      logs: true,
    });
    switch (status) {
      case "COMPLETED": {
        const { data } = await fal.queue.result(endpoint, { requestId: task });
        return data;
      }
      default: {
        const { maxAttempts, checkInterval } = this.options;
        if (attempt >= maxAttempts) {
          const now = new Date();
          const time = (now - new Date(startedAt)) / 1_000;
          throwError.timeout(`Task ${task} timeout in ${time} sec`);
        }
        return {
          __repeat: repeat({
            state: { task, endpoint, attempt: attempt + 1 },
            progress: {
              total: maxAttempts,
              processed: attempt,
            },
            delay: checkInterval,
          }),
        };
      }
    }
  }
}
