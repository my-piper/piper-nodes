const CHECK_TASK_INTERVAL = 3000;
const MAX_ATTEMPTS = 20;

export async function costs({ env }) {
  if (env.scope.ARTWORKS_USER === "user") {
    return 0;
  }
  return 0.001;
}

export async function run({ env, inputs, state }) {
  const { throwError, repeat, next, download } = require("@piper/node");
  const { ArtWorks, FatalError } = require("artworks");
  const sharp = require("sharp/lib/index.js");

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
    const {
      image,
      type = "yolo",
      model = "deepfashion2_yolov8s-seg.pt",
      prompt,
      threshold,
      applyConvexHull,
    } = inputs;

    const payload = {
      type: "image-to-mask",
      isFast: true,
      payload: {
        base64: false,
        image,
        type,
        model,
        prompt,
        threshold,
        applyConvexHull,
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
        delay: CHECK_TASK_INTERVAL,
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
      const { masks: detected } = results;
      const { image } = inputs;
      const { data } = await download(image);
      const { width, height } = await sharp(data).metadata();

      const areas = [];
      const masks = [];
      for (const m of detected) {
        const {
          mask,
          confidence,
          className,
          coordinates: [left, top],
        } = m;

        const buffer = Buffer.from(mask, "base64");

        areas.push({
          input: buffer,
          top,
          left,
        });

        const { width, height } = await sharp(buffer).metadata();
        masks.push({
          top,
          left,
          width,
          height,
          className,
          confidence,
        });
      }

      let merged = await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: { r: 0, g: 0, b: 0 },
        },
      }).composite(areas);
      return next({
        outputs: {
          masks,
          merged: await merged.png().toBuffer(),
        },
        costs: costs({ env, inputs }),
      });
    } catch (e) {
      if (e instanceof FatalError) {
        throwError.fatal(e.message);
      }
      throw e;
    }
  }
}
