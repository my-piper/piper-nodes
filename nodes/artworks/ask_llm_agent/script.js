import { next, throwError } from "../../../utils/node.js";
import { ArtWorks } from "../utils.js";

export function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.001;
}

const CHECK_INTERVAL = 2_000;
const MAX_ATTEMPTS = 20;

export async function run({ env, inputs, state }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      model,
      question = "What do you think about AI?",
      image,
      answerFormat = "text",
      instructions,
    } = inputs;

    const messages = [];
    if (instructions) {
      messages.push({
        role: "system",
        content: instructions,
      });
    }

    if (image) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: question },
          {
            type: "image_url",
            image_url: { url: image },
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: question,
      });
    }

    return await artworks.createTask({
      type: "ask-llm",
      payload: {
        base64: false,
        model,
        format: answerFormat,
        messages,
      },
    });
  }

  const results = await artworks.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { answerFormat } = inputs;
  const {
    message: { content: answer },
  } = results;

  switch (answerFormat) {
    case "json":
      try {
        const json = answer
          .replace(/^\`\`\`json\s*/gi, "")
          .replace(/\`\`\`\s*$/gi, "");
        return next({
          outputs: { json: JSON.parse(json) },
          costs: costs({ env, inputs }),
        });
      } catch (e) {
        console.error(e);
        throwError.fatal("Can't parse JSON answer from LLM");
      }
      break;
    case "text":
    default:
      return next({
        outputs: { text: answer.replace(/<think>[\s\S]*?<\/think>/g, "") },
        costs: costs({ env, inputs }),
      });
  }
}
