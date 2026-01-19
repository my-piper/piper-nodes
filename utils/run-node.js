const MAX_ATTEMPTS = 100;
const DEFAULT_DELAY = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runNode(run, payload) {
  let state;
  let attempts = 0;
  while (attempts < MAX_ATTEMPTS) {
    // deno-lint-ignore no-await-in-loop
    const results = await run({ ...payload, state });
    if (results.__type === "repeat") {
      console.log(`Repeat node ${attempts} / ${MAX_ATTEMPTS}`);
      const { delay } = results;
      state = results.state ?? state;
      // deno-lint-ignore no-await-in-loop
      await sleep(delay || DEFAULT_DELAY);
      attempts++;
    } else if (results.__type === "next") {
      return results;
    } else {
      throw new Error(`Unknown run result: ${JSON.stringify(results)}`);
    }
  }

  throw new Error("Max attempts exceeded");
}
