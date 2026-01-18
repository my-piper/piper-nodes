export async function run({ env, inputs, state }) {
  const { next, repeat, throwError } = require("@piper/node");
  const { ArtWorks, FatalError: ArtWorksError } = require("artworks");

  const MAX_ATTEMPTS = 10;
  const CHECK_TASK_INTERVAL = 2000;

  const { PAAS_BASE_URL, PAAS_USER, PAAS_PASSWORD } = env.variables;

  if (!PAAS_BASE_URL) {
    throwError.fatal("Please, set PAAS_BASE_URL in environment");
  }
  if (!PAAS_USER) {
    throwError.fatal("Please, set PAAS_USER in environment");
  }
  if (!PAAS_PASSWORD) {
    throwError.fatal("Please, set PAAS_PASSWORD in environment");
  }

  const artworks = new ArtWorks({
    baseUrl: PAAS_BASE_URL,
    username: PAAS_USER,
    password: PAAS_PASSWORD,
  });

  if (!state) {
    const { video1, video2 } = inputs;
    const filter = `[0:v]trim=0:4,setpts=PTS-STARTPTS[v0];
[1:v]trim=0:4,setpts=PTS-STARTPTS[v1];
[v0][v1]concat=n=2:v=1:a=0,fps=40[outv]`
    const command = `-i {{video1}} -i {{video2}} -filter_complex "${filter}" -map "[outv]" -an -c:v libx264 -crf 18 -preset medium {{output}}`;

    const payload = {
      type: "run-ffmpeg",
      isFast: true,
      payload: {
        command,
        inputFiles: {
          video1,
          video2,
        },
        outputFiles: {
          output: "output.mp4",
        },
      },
    };
    try {
      const task = await artworks.createTask(payload);
      console.log(`Task created ${task}`);
      return repeat({
        state: {
          payload,
          task,
          attempt: 0,
          startedAt: new Date(),
        },
        progress: {
          total: MAX_ATTEMPTS,
          processed: 0,
        },
        delay: 2000,
      });
    } catch (e) {
      if (e instanceof ArtWorksError) {
        throwError.fatal(e.message);
      }
      throw e;
    }
  } else {
    const { payload, task, attempt, startedAt } = state;

    if (attempt > MAX_ATTEMPTS) {
      try {
        await artworks.cancelTask(task);
      } catch (e) {}

      const now = new Date();
      const time = (now - new Date(startedAt)) / 1000;
      throwError.timeout(`PaaS task ${task} timeout in ${time} sec`);
    }

    console.log(`Check task ${attempt} ${task}`);

    try {
      const results = await artworks.checkState(task);
      if (!results) {
        return repeat({
          delay: CHECK_TASK_INTERVAL,
          state: {
            payload,
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
          output: { url: video },
        },
      } = results;
      return next({
        outputs: { video },
      });
    } catch (e) {
      if (e instanceof ArtWorksError) {
        throwError.fatal(e.message);
      }
      throw e;
    }
  }
}
