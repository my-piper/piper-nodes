import { next } from "../../../utils/node.js";
import { ArtWorks } from "../utils.js";

export function costs({ env, inputs }) {
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

const CHECK_INTERVAL = 5_000;
const MAX_ATTEMPTS = 150;

export async function run({ env, inputs, state }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      person,
      prompt = "Close-up portrait of Harry Potter, detailed, high resolution",
      upscale,
      aspectRatio = "9:16",
    } = inputs;

    return await artworks.createTask({
      type: "run-comfy",
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
    });
  }

  const results = await artworks.checkState(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const {
    images: [{ url: image }],
  } = results;
  return next({
    outputs: { image },
    costs: costs({ env, inputs }),
  });
}
