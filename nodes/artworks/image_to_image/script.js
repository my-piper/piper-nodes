import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";
import { next, repeat, throwError } from "../../../utils/node.js";
import { ArtWorks, FatalError, fitSize } from "../utils.js";

const CHECK_TASK_INTERVAL = 3000;
const MAX_ATTEMPTS = 100;

export function costs({ env, inputs }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }

  const { performance = "speed", batchSize = 1 } = inputs;
  const imageCost = (() => {
    switch (performance) {
      case "express":
        return 0.005;
      case "quality":
        return 0.015;
      case "speed":
      default:
        return 0.01;
    }
  })();

  return batchSize * imageCost;
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
      image,
      prompt = "cat walking on the Mars",
      checkpoint,
      negativePrompt,
      imageSize,
      denoisingStrength,
      cfgScale,
      performance,
      batchSize,
      seed,
      // SDXL
      sharpness,
    } = inputs;
    const payload = {
      type: "image-to-image",
      isFast: true,
      payload: {
        base64: false,
        image,
        prompt,
        checkpoint,
        negativePrompt,
        ...(imageSize
          ? await (async () => {
              const response = await fetch(image);
              const arrayBuffer = await response.arrayBuffer();
              const buffer = new Uint8Array(arrayBuffer);
              const img = await Image.decode(buffer);
              const { width, height } = img;
              if (imageSize !== "auto:auto") {
                const { width: w, height: h } = fitSize(
                  imageSize,
                  height / width
                );
                return { size: `${w}x${h}` };
              }

              return {};
            })()
          : {}),
        denoisingStrength,
        cfgScale,
        performance,
        batchSize,
        seed,
        // SDXL
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
        delay: CHECK_TASK_INTERVAL,
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
