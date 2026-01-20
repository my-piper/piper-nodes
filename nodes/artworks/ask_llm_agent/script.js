const CHECK_TASK_INTERVAL = 2000;
const MAX_ATTEMPTS = 20;

export async function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.001;
}

export async function run({ env, inputs, state }) {
  const { throwError, repeat, next } = require("@piper/node");
  const { ArtWorks, FatalError } = require("artworks");

  const {
    model = "deepseek-r1:8b",
    image,
  } = inputs;

  const isVisionModel = model.includes("qwen3-vl");

  let artworks;

  if (isVisionModel) {
    // Dev API with static credentials for Qwen3-VL
    artworks = new ArtWorks({
      baseUrl: "https://dev-api.artworks.ai",
      username: "pw",
      password: "G8THxvqKQLLdWvgf",
    });
  } else {
    // Production API with user credentials
    const { ARTWORKS_USER, ARTWORKS_PASSWORD } = env.variables;
    if (!ARTWORKS_USER) {
      throwError.fatal("Please, set ARTWORKS_USER in environment");
    }
    if (!ARTWORKS_PASSWORD) {
      throwError.fatal("Please, set ARTWORKS_PASSWORD in environment");
    }

    artworks = new ArtWorks({
      baseUrl: "https://api.artworks.ai",
      username: ARTWORKS_USER,
      password: ARTWORKS_PASSWORD,
    });
  }

  if (!state) {
    const {
      question = "What do you think about AI?",
      answerFormat = "text",
      instructions,
    } = inputs;

    let userMessage;

    // Qwen3-VL with image: use array format
    if (isVisionModel && image) {
      userMessage = {
        role: "user",
        content: [
          { type: "text", text: question },
          {
            type: "image_url",
            image_url: { url: image },
          },
        ],
      };
    } else {
      // Standard text format for all other cases
      userMessage = {
        role: "user",
        content: question,
      };
    }

    const payload = {
      type: "ask-llm",
      isFast: true,
      payload: {
        base64: false,
        model,
        format: answerFormat,
        messages: [
          ...(instructions
            ? [
                {
                  role: "system",
                  content: instructions,
                },
              ]
            : []),
          userMessage,
        ],
      },
    };

    try {
      const task = await artworks.createTask(payload);
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

      const { answerFormat } = inputs;
      const {
        message: { content: answer },
      } = results;

      switch (answerFormat) {
        case "text":
          return next({
            outputs: { text: answer.replace(/<think>[\s\S]*?<\/think>/g, "") },
            costs: await costs({ env, inputs }),
          });
        case "json":
          try {
            const json = answer
              .replace(/^\`\`\`json\s*/gi, "")
              .replace(/\`\`\`\s*$/gi, "");
            return next({
              outputs: { json: JSON.parse(json) },
              costs: await costs({ env, inputs }),
            });
          } catch (e) {
            throwError.fatal("Can't parse JSON answer from LLM");
          }
        default:
          throwError.fatal(`Wrong answer format ${answerFormat}`);
      }
    } catch (e) {
      if (e instanceof FatalError) {
        throwError.fatal(e.message);
      }
      throw e;
    }
  }
}
