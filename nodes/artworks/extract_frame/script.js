const MAX_ATTEMPTS = 1000;
const CHECK_TASK_INTERVAL = 5000;

export async function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.001;
}

export async function run({ inputs, state, env }) {
  const { next, repeat, throwError, download } = require("@piper/node");
  const { ArtWorks, FatalError: FatalError } = require("artworks");

  const { ARTWORKS_USER, ARTWORKS_PASSWORD } = env.variables;
  if (!ARTWORKS_USER) {
    throwError.fatal("Please, set ARTWORKS_USER");
  }
  if (!ARTWORKS_PASSWORD) {
    throwError.fatal("Please, set ARTWORKS_PASSWORD");
  }

  const artworks = new ArtWorks({
    baseUrl: "https://api.artworks.ai",
    username: ARTWORKS_USER,
    password: ARTWORKS_PASSWORD,
  });

  if (!state) {
    const { video, position } = inputs;

    const payload = {
      type: "run-ffmpeg",
      isFast: true,
      payload: {
        command: (() => {
          switch (position) {
            case "first":
              return "-i {{video}} -frames:v 1 {{frame}}";
            case "last":
            default:
              return "-sseof -0.1 -i {{video}} -frames:v 1 {{frame}}";
          }
        })(),
        inputFiles: {
          video,
        },
        outputFiles: {
          frame: "frame.png",
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
      } catch (e) {}

      const now = new Date();
      const time = (now - new Date(startedAt)) / 1000;
      throwError.timeout(`PaaS task ${task} timeout in ${time} sec`);
    }
  }

  const { task, attempt, startedAt } = state;
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
    files: {
      frame: { url },
    },
  } = results;

  const { data: frame } = await download(url);
  return next({ outputs: { frame }, costs: costs({ env }) });
}
