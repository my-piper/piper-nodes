const CHECK_TASK_INTERVAL = 5000;
const MAX_ATTEMPTS = 100;

export async function costs({ env, inputs }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  const { performance, batchSize } = inputs;

  const imageCost = (() => {
    switch (performance) {
      case "express":
        return 0.005;
      case "speed":
        return 0.01;
      case "quality":
        return 0.015;
      default:
        throw new Error("Unknown performance type");
    }
  })();

  return batchSize * imageCost;
}

export async function run({ inputs, state, env }) {
  const { throwError, repeat, next, download } = require("@piper/node");
  const { ArtWorks, FatalError } = require("artworks");

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
      prompt = "extend image",
      checkpoint,
      negativePrompt,
      denoisingStrength,
      cfgScale,
      performance,
      batchSize,
      seed,
      // distance
      distanceTop = 50,
      distanceRight = 50,
      distanceBottom = 50,
      distanceLeft = 50,
    } = inputs;

    const payload = {
      type: "outpaint-on-image",
      isFast: true,
      payload: {
        base64: false,
        image,
        prompt,
        checkpoint,
        negativePrompt,
        denoisingStrength,
        cfgScale,
        performance,
        batchSize,
        seed,
        // distance
        distanceTop,
        distanceRight,
        distanceBottom,
        distanceLeft,
      },
    };

    console.log(JSON.stringify(payload, null, 2));

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
        delay: 5000,
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
      } catch (e) {}

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
      let images = results.images.map((i) => i.url);
      return next({
        outputs: {
          images: (await Promise.all(images.map((url) => download(url)))).map(
            ({ data }) => data,
          ),
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
