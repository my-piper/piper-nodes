import { repeat, throwError } from "../../utils/node.js";

export function fitSize(imageSize, aspectRatio) {
  const [w, h] = imageSize.split(":");
  if (w === "auto") {
    const target = parseInt(h);
    return { height: target, width: Math.ceil(target * aspectRatio) };
  }

  if (h === "auto") {
    const target = parseInt(w);
    return { width: target, height: Math.ceil(target * aspectRatio) };
  }

  throwError.fatal(`Wrong image size format: ${imageSize}`);
}

const BASE_URL = "https://api.artworks.ai";

export class ArtWorks {
  options = {};
  constructor(env, options = {}) {
    const { ARTWORKS_USER, ARTWORKS_PASSWORD } = env.variables;
    if (!ARTWORKS_USER) {
      throwError.fatal("Please, set ARTWORKS_USER in environment");
    }
    if (!ARTWORKS_PASSWORD) {
      throwError.fatal("Please, set ARTWORKS_PASSWORD in environment");
    }

    this.username = ARTWORKS_USER;
    this.password = ARTWORKS_PASSWORD;
    this.options = { checkInterval: 3_000, maxAttempts: 100, ...options };
  }

  getUrl(path) {
    return `${BASE_URL}/api/v3/${path}`;
  }

  async createTask(payload) {
    const { username, password } = this;

    console.log(JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(this.getUrl("tasks"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        },
        body: JSON.stringify({ isFast: true, ...payload }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const { errors } = data;
        if (errors?.length > 0) {
          throwError.fatal(errors.join(", "));
        }
        throwError.fatal(response.statusText);
      }

      const data = await response.json();
      const { id: task } = data;
      console.log(`Task created ${task}`);
      const { checkInterval: delay, maxAttempts } = this.options;
      return repeat({
        state: {
          task,
          startedAt: new Date().toISOString(),
        },
        progress: {
          processed: 0,
          total: maxAttempts,
        },
        delay,
      });
    } catch (e) {
      throwError.fatal(e.message);
    }
  }

  async checkTask(id) {
    const { username, password } = this;
    console.debug(`Cancel task ${id}`);
    try {
      const response = await fetch(this.getUrl(`tasks/${id}/cancel`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const { errors } = data;
        if (errors?.length > 0) {
          throwError.fatal(errors.join(", "));
        }
        throwError.fatal(response.statusText);
      }
    } catch (e) {
      throwError.fatal(e.message);
    }
  }

  async checkState(state) {
    const { task, attempt = 0, startedAt } = state;
    console.log(`Check task ${attempt} ${task}`);

    const { username, password } = this;
    const response = await fetch(this.getUrl(`tasks/${task}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      },
    });

    if (!response.ok) {
      throwError.fatal(response.statusText);
    }

    const data = await response.json();
    const { status, results } = data;
    switch (status) {
      case "preparing":
      case "scheduling":
      case "scheduled":
      case "pending":
      case "processing": {
        const { checkInterval: delay, maxAttempts } = this.options;
        if (attempt > maxAttempts) {
          try {
            await this.cancelTask(task);
          } catch (_e) {
            // Ignore errors when canceling task
          }

          const now = new Date();
          const time = (now - new Date(startedAt)) / 1_000;
          throwError.timeout(`Task ${task} timeout in ${time} sec`);
        }
        return {
          __repeat: repeat({
            state: {
              task,
              attempt: attempt + 1,
              startedAt,
            },
            progress: {
              processed: attempt,
              total: maxAttempts,
            },
            delay,
          }),
        };
      }
      case "completed": {
        const { data } = results;
        return data;
      }
      case "failed": {
        const { error } = results;
        throwError.fatal(error);
        break;
      }
      default:
        throwError.fatal("Wrong task status");
    }
  }
}
