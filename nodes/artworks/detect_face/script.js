import { Image } from "https://deno.land/x/imagescript@1.2.15/mod.ts";
import { next, throwError } from "../../../utils/node.js";
import { ArtWorks } from "../utils.js";

export function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.005;
}

const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 10;

const FIT_FACE_SIZE = 512;

export function fit(image, { maxWidth, maxHeight }) {
  const { width, height } = image;
  const orientation = width >= height ? "-" : "|";

  switch (orientation) {
    case "-":
      if (width > maxWidth) {
        return image.resize(maxWidth, Image.RESIZE_AUTO);
      }
      break;
    case "|":
      if (height > maxHeight) {
        return image.resize(Image.RESIZE_AUTO, maxHeight);
      }
      break;
  }

  return image;
}

export async function crop(source, face) {
  const image = await Image.decode(source);

  const UNCROP = 0.6;

  let { x, y, width, height } = face;

  const uncropX = width * UNCROP;
  const uncropY = height * UNCROP;

  width = Math.round(width + uncropX);
  height = Math.round(height + uncropY);
  x = Math.round(x - uncropX / 2);
  y = Math.round(y - uncropY / 2);

  const [left, top] = [Math.max(x, 0), Math.max(y, 0)];
  [width, height] = [
    Math.min(width, image.width - left),
    Math.min(height, image.height - top),
  ];

  let cropped = image.crop(left, top, width, height);

  cropped = fit(cropped, {
    maxWidth: FIT_FACE_SIZE,
    maxHeight: FIT_FACE_SIZE,
  });

  return await cropped.encode();
}

export async function run({ env, inputs, state }) {
  const artworks = new ArtWorks(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  if (!state) {
    const { image } = inputs;

    return await artworks.createTask({
      type: "detect-faces",
      payload: {
        base64: false,
        image,
        features: ["age", "gender", "race", "emotion"],
      },
    });
  }

  const results = await artworks.checkState(state);
  if ("__repeat" in results) {
    return results.__repeat;
  }

  const { faces } = results;
  const { image, index } = inputs;
  const face = faces[index];
  if (!face) {
    throwError.fatal("Face with such index was not found");
  }
  const { x, y, width, height, ageFrom, ageTo, gender, race, emotion } = face;
  const response = await fetch(image);
  const data = new Uint8Array(await response.arrayBuffer());
  return next({
    outputs: {
      face: await crop(data, {
        x,
        y,
        width,
        height,
      }),
      features: {
        ageFrom,
        ageTo,
        gender,
        race,
        emotion,
      },
    },
    costs: costs({ env, inputs }),
  });
}
