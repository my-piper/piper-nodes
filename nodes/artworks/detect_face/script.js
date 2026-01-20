const CHECK_TASK_INTERVAL = 3000;
const MAX_ATTEMPTS = 10;

export async function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.005;
}

const FIT_FACE_SIZE = 512;

export async function fit(image, { maxWidth, maxHeight }) {
  const { width, height } = await image.metadata();
  const orientation = width >= height ? "-" : "|";

  const sharp = require("sharp/lib/index.js");

  switch (orientation) {
    case "-":
      if (width > maxWidth) {
        return sharp(await image.resize({ width: maxWidth }).toBuffer());
      }
      break;
    case "|":
      if (height > maxHeight) {
        return sharp(await image.resize({ height: maxHeight }).toBuffer());
      }
      break;
  }

  return image;
}

export async function crop(source, face) {
  const sharp = require("sharp/lib/index.js");

  const image = await sharp(source);
  const metadata = await image.metadata();

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
    Math.min(width, metadata.width - left),
    Math.min(height, metadata.height - top),
  ];

  const crop = {
    left,
    top,
    width,
    height,
  };

  const area = await fit(await image.clone().extract(crop).webp(), {
    maxWidth: FIT_FACE_SIZE,
    maxHeight: FIT_FACE_SIZE,
  });

  return area.toBuffer();
}

export async function run({ env, inputs, state }) {
  const { throwError, repeat, next, download } = require("@piper/node");
  const { ArtWorks, FatalError } = require("artworks");

  const { ARTWORKS_USER, ARTWORKS_PASSWORD } = env.variables;
  if (!ARTWORKS_USER) {
    throwError.fatal("Please, set ARTWORKS_USER in environment");
  }
  if (!ARTWORKS_PASSWORD) {
    throwError.fatal("Please, set ARTWORKS_PASSWORD in environment");
  }

  const artworks = new ArtWorks({
    baseUrl: "https://api.artworks.ai",
    username: ARTWORKS_USER,
    password: ARTWORKS_PASSWORD,
  });

  if (!state) {
    const { image } = inputs;

    const payload = {
      type: "detect-faces",
      isFast: true,
      payload: {
        base64: false,
        image,
        features: ["age", "gender", "race", "emotion"],
      },
    };

    console.log(JSON.stringify(payload, null, 2));

    try {
      const task = await artworks.createTask(payload);
      console.log(`Task created ${task}`);
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
        delay: 2000,
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

    console.log(`Check task ${attempt} ${task}`);

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
      const { faces } = results;
      const { image, index } = inputs;
      const face = faces[index];
      if (!face) {
        throwError.fatal("Face with such index was not found");
      }
      const { x, y, width, height, ageFrom, ageTo, gender, race, emotion } =
        face;
      const { data } = await download(image);
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
          costs: costs({ env, inputs }),
        },
      });
    } catch (e) {
      if (e instanceof FatalError) {
        throwError.fatal(e.message);
      }
      throw e;
    }
  }
}
