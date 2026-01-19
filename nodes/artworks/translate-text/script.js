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
    const { source, target, text } = inputs;

    const payload = {
      type: "translate-text",
      isFast: true,
      payload: {
        source,
        target,
        text,
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
      const { alternatives, detectedLanguage, text } = results;
      return next({
        outputs: {
          alternatives,
          detectedLanguage,
          text,
        },
      });
    } catch (e) {
      if (e instanceof ArtWorksError) {
        throwError.fatal(e.message);
      }
      throw e;
    }
  }
}
