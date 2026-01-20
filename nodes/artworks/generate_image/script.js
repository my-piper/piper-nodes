import { next, repeat, throwError } from "../../../utils/node.js";
import { ArtWorks, FatalError } from "../utils.js";

const CHECK_TASK_INTERVAL = 3000;
const MAX_ATTEMPTS = 100;

export function costs({ env, inputs }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }

  const { batchSize = 1, performance = "speed" } = inputs;

  const { costs, details } = (() => {
    switch (performance) {
      case "express":
        return { costs: 0.0025, details: "en=For express;ru=Экспресс" };
      case "speed":
        return { costs: 0.005, details: "en=For speed;ru=Скорость" };
      case "quality":
        return { costs: 0.01, details: "en=For quality;ru=Качество" };
      default:
        throw new Error("Unknown performance type");
    }
  })();

  return { costs: batchSize * costs, details };
}

export async function run({ env, inputs, state }) {
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
    const {
      prompt,
      negativePrompt,
      checkpoint,
      cfgScale,
      imageSize: size,
      performance,
      sharpness,
      seed,
      batchSize,
      // SDXL
      styles,
    } = inputs;

    const payload = {
      type: "text-to-image",
      isFast: true,
      payload: {
        base64: false,
        prompt,
        negativePrompt,
        checkpoint,
        cfgScale,
        size,
        performance,
        seed,
        batchSize,
        // SDXL
        ...(() => {
          switch (checkpoint) {
            case "PonyASDF_0.4_f6cosineb.fp16.safetensors":
              return { styles: ["Fooocus Pony", "Fooocus Masterpiece"] };
            case "asdf_0.4a_lorapov_0.2_lust_0.4.fp16.safetensors":
            case "aniku_0.2.fp16.safetensors":
              return { styles: [] };
            case "anikurender_0.4b.fp16.safetensors":
              return {
                styles: ["Fooocus Sharp", "Fooocus Pony", "Fooocus V2"],
              };
            default:
              return styles?.length > 0 ? { styles } : { styles };
          }
        })(),
        sharpness,
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
      const images = results.images.map((i) => i.url);
      return next({
        outputs: {
          images,
        },
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
