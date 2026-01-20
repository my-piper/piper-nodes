const CHECK_TASK_INTERVAL = 5000;
const MAX_ATTEMPTS = 150;

export async function costs({ env, inputs }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }

  const { upscale } = inputs;
  return (
    0.01 *
    (() => {
      switch (upscale) {
        case "skin_detailing":
          return 2;
        case "enhancing_quality":
          return 3;
        case "full_enhancing":
          return 4;
        case "no":
        default:
          return 1;
      }
    })()
  );
}

export async function run({ env, inputs, state }) {
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
      person,
      prompt = "Close-up portrait of Iron Man",
      upscale,
      aspectRatio = "9:16",
    } = inputs;

    const payload = {
      type: "run-comfy",
      isFast: true,
      payload: {
        pipeline: (() => {
          switch (upscale) {
            case "skin_detailing":
              return "pullid_upscale_x1";
            case "enhancing_quality":
              return "pullid_upscale_x4";
            case "full_enhancing":
              return "pullid_upscale_full";
            case "no":
            default:
              return "pullid_upscale_off";
          }
        })(),
        args: {
          image: person,
          prompt,
          aspect_ratio: aspectRatio,
        },
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
      const {
        images: [{ url }],
      } = results;
      const { data: image } = await download(url);
      return next({
        outputs: { image },
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
