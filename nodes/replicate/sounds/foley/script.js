import { next } from "../../../../utils/node.js";
import { Replicate } from "../../utils.js";

const COST_PER_RUN = 0.023;
const MODEL_VERSION =
  "88045928bb97971cffefabfc05a4e55e5bb1c96d475ad4ecc3d229d9169758ae";
const CHECK_INTERVAL = 3_000;
const MAX_ATTEMPTS = 100;

export function costs({ env }) {
  if (Replicate.userScope(env)) {
    return 0;
  }
  return COST_PER_RUN;
}

export async function run({ env, inputs, state }) {
  const replicate = new Replicate(env, {
    checkInterval: CHECK_INTERVAL,
    maxAttempts: MAX_ATTEMPTS,
  });

  const {
    video,
    prompt,
    neg_prompt,
    guidance_scale,
    num_inference_steps,
    return_audio,
  } = inputs;

  if (!state) {
    const payload = {
      video,
      prompt,
      neg_prompt,
      guidance_scale,
      num_inference_steps,
      return_audio,
    };

    const result = await replicate.createTask(
      `models/tencent/hunyuanvideo-foley/versions/${MODEL_VERSION}/predictions`,
      payload
    );
    return {
      ...result,
      state: { ...result.state, return_audio },
    };
  }

  const results = await replicate.checkTask(state);
  if ("__repeat" in results) {
    return {
      ...results.__repeat,
      state: { ...results.__repeat.state, return_audio: state.return_audio },
    };
  }

  const { output } = results;
  const outputKey = state.return_audio ? "audio" : "video";
  return next({
    outputs: { [outputKey]: output },
    costs: costs({ env }),
  });
}
