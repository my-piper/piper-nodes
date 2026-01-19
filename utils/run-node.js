const MAX_ATTEMPTS = 100;
const DEFAULT_DELAY = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runNode(run, payload, attempts = 0) {
  const results = await run(payload);

  if (attempts > MAX_ATTEMPTS) {
    throw new Error("Max attempts exceeded");
  }

  if (results.__type === "repeat") {
    console.log(`Repeat node ${attempts} / ${MAX_ATTEMPTS}`);
    const { delay, state } = results;
    await sleep(delay || DEFAULT_DELAY);
    return await runNode(run, { ...payload, state }, attempts + 1);
  } else if (results.__type === "next") {
    return results;
  } else {
    throw new Error(`Unknown run result: ${JSON.stringify(results)}`);
  }
}
