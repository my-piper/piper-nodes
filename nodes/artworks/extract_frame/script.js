import { next } from "../../../utils/node.js";
import { ArtWorks } from "../utils.js";

export function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.001;
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 1000;

export async function run({ inputs, state, env }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const { video, position } = inputs;

    return await artworks.createTask({
      type: "run-ffmpeg",
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
    });
  }

  const results = await artworks.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const {
    files: {
      frame: { url: frame },
    },
  } = results;

  return next({ outputs: { frame }, costs: costs({ env }) });
}
