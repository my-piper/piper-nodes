const CHECK_TASK_INTERVAL = 5000;
const MAX_ATTEMPTS = 150;

export async function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.05;
}

export async function run({ inputs, state, env }) {
  const { throwError, repeat, next, download } = require("@piper/node");
  const { ArtWorks, FatalError: FatalError } = require("artworks");

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
      version,
      prompt = "cat astronaut walking at a moon",
      image,
      videoSize,
      length = "5s",
      resolution,
      fps,
    } = inputs;

    const payload = {
      type: !!image ? "image-to-video" : "text-to-video",
      payload: {
        base64: false,
        version: (() => {
          switch (version) {
            case "2_1":
              return "v1";
            case "2_2":
            default:
              return "v2";
          }
        })(),
        prompt,
        size: videoSize,
        image,
        ...(() => {
          switch (length) {
            case "8s":
              return {
                numFrames: 128,
              };
            case "5s":
            default:
              return {
                numFrames: 80,
              };
          }
        })(),
        ...(() => {
          switch (fps) {
            case "24":
              return {
                applyInterpolation: true,
                interpolationFps: 24,
              };
            case "30":
              return {
                applyInterpolation: true,
                interpolationFps: 30,
              };
            case "60":
              return {
                applyInterpolation: true,
                interpolationFps: 60,
              };
            case "16":
            default:
              return {};
          }
        })(),
        resolution
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
        delay: 7000,
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
      throwError.timeout(
        `PaaS task for text to image ${task} timeout in ${time} sec`,
      );
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
      let {
        video: { url },
      } = results;
      const { data: video } = await download(url);
      return next({ outputs: { video }, costs: costs({ env, inputs }) });
    } catch (e) {
      if (e instanceof FatalError) {
        throwError.fatal(e.message);
      }
      throw e;
    }
  }
}
