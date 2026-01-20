const MAX_ATTEMPTS = 100;
const CHECK_TASK_INTERVAL = 3000;

export async function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.005;
}

export async function run({ schema, inputs, state, env }) {
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
    const videos = [];
    for (const id of Object.keys(schema.node.inputs)) {
      const input = schema.node.inputs[id];
      const value = inputs[id];
      if (input.type === "video" && !!value) {
        videos.push(value);
      }
    }

    const payload = {
      type: "run-ffmpeg",
      isFast: true,
      payload: {
        command: (() => {
          const i = videos.map((_, i) => `-i {{video_${i}}}`).join(" ");

          const { width, height } = inputs;

          const filters = videos.map(
            (_, idx) =>
              `[${idx}:v]` +
              `scale=${width}:${height}:force_original_aspect_ratio=decrease,` +
              `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black,` +
              `setsar=1,` +
              `setpts=PTS-STARTPTS` +
              `[v${idx}]`,
          );

          const ci = videos.map((_, idx) => `[v${idx}]`).join("");
          const cf = `${ci}concat=n=${videos.length}:v=1:a=0[merged_video]`;
          const complexFilter = [filters.join(";"), cf].join(";");
          return `${i} -filter_complex "${complexFilter}" -map "[merged_video]" {{merged_video}}`;
        })(),
        inputFiles: (() => {
          const files = {};
          videos.forEach((v, i) => {
            files[`video_${i}`] = v;
          });
          return files;
        })(),
        outputFiles: {
          merged_video: "merged_video.mp4",
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
      merged_video: { url },
    },
  } = results;

  const { data: video } = await download(url);
  return next({ outputs: { video }, costs: costs({ env }) });
}
