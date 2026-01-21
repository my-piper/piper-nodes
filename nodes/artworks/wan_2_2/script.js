import { next } from "../../../utils/node.js";
import { ArtWorks } from "../utils.js";

export function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.05;
}

const CHECK_INTERVAL = 5_000;
const MAX_ATTEMPTS = 150;

export async function run({ inputs, state, env }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      version,
      prompt = "cat astronaut walking at a moon",
      image,
      videoSize,
      length,
      resolution,
      fps,
    } = inputs;
    return await artworks.createTask({
      type: image ? "image-to-video" : "text-to-video",
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
        resolution,
      },
    });
  }

  const results = await artworks.checkState(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const {
    video: { url: video },
  } = results;

  return next({ outputs: { video }, costs: costs({ env }) });
}
