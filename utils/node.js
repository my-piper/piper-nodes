const MAX_ATTEMPTS = 30;
const DEFAULT_DELAY = 1000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runNode(run, payload) {
    const results = await run(payload);

    if(results.__type === "repeat") {
        console.log("Repeat node");
        const { delay, state } = results;
        await sleep(delay || DEFAULT_DELAY);
        return await runNode(run, {
            ...payload,
            state,
        });
    }else if(results.__type === "next") {
        return results;
    }else {
        throw new Error(`Unknown run result: ${JSON.stringify(results)}`);
    }

    return results;
}