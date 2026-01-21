import { next } from "../../../utils/node.js";
import { ArtWorks } from "../utils.js";

export function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.005;
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 100;

export async function run({ schema, inputs, state, env }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
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

    return await artworks.createTask({
      type: "run-ffmpeg",
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
              `[v${idx}]`
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
    });
  }

  const results = await artworks.checkState(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const {
    files: {
      merged_video: { url: video },
    },
  } = results;

  return next({ outputs: { video }, costs: costs({ env }) });
}
