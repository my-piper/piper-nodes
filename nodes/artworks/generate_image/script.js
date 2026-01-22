import { next } from "../../../utils/node.js";
import { ArtWorks } from "../utils.js";

export function costs({ env, inputs }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }

  const { batchSize = 1, performance = "speed" } = inputs;

  const { costs, details } = (() => {
    switch (performance) {
      case "speed":
        return { costs: 0.005, details: "en=For speed;ru=Скорость" };
      case "quality":
        return { costs: 0.01, details: "en=For quality;ru=Качество" };
      case "express":
      default:
        return { costs: 0.0025, details: "en=For express;ru=Экспресс" };
    }
  })();

  return { costs: batchSize * costs, details };
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 100;

export async function run({ env, inputs, state }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const {
      prompt,
      negativePrompt,
      checkpoint,
      cfgScale,
      imageSize: size,
      performance,
      sharpness,
      seed,
      batchSize,
      // SDXL
      styles,
      templates,
    } = inputs;

    return await artworks.createTask({
      type: "text-to-image",
      payload: {
        base64: false,
        prompt: (() => {
          const chunks = [prompt];
          for (const t of templates || []) {
            if (t.trainedWords?.length > 0) {
              chunks.push(...t.trainedWords);
            }
          }
          return chunks.join(", ");
        })(),
        negativePrompt,
        checkpoint,
        cfgScale,
        size,
        performance,
        seed,
        batchSize,
        // SDXL
        ...(() => {
          switch (checkpoint) {
            case "PonyASDF_0.4_f6cosineb.fp16.safetensors":
              return { styles: ["Fooocus Pony", "Fooocus Masterpiece"] };
            case "asdf_0.4a_lorapov_0.2_lust_0.4.fp16.safetensors":
            case "aniku_0.2.fp16.safetensors":
              return { styles: [] };
            case "anikurender_0.4b.fp16.safetensors":
              return {
                styles: ["Fooocus Sharp", "Fooocus Pony", "Fooocus V2"],
              };
            default:
              return styles?.length > 0 ? { styles } : { styles };
          }
        })(),
        sharpness,
        ...(templates?.length > 0
          ? {
              loras: templates.map(({ fullFileName, weight }) => ({
                modelName: fullFileName,
                weight,
              })),
            }
          : {}),
      },
    });
  }

  const results = await artworks.checkTask(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const images = results.images.map((i) => i.url);
  return next({
    outputs: {
      images,
    },
    costs: costs({ env, inputs }),
  });
}
