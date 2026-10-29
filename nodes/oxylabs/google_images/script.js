import { next, throwError } from "../../../utils/node.js";

export function costs({ env }) {
  if (env.scope.OXYLABS_AUTH === "user") {
    return 0;
  }
  return 0.001;
}

export async function run({ env, inputs }) {
  const { OXYLABS_AUTH } = env.variables;
  if (!OXYLABS_AUTH) {
    throwError.fatal("Please, set OXYLABS_AUTH in environment");
  }

  const { query } = inputs;

  const response = await fetch("https://realtime.oxylabs.io/v1/queries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + btoa(OXYLABS_AUTH),
    },
    body: JSON.stringify({
      source: "google_search",
      domain: "nl",
      query,
      parse: true,
      context: [
        {
          key: "tbm",
          value: "isch",
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Oxylabs error ${response.status}: ${errorText}`);
  }

  const data = await response.json();

  const {
    results: [
      {
        content: {
          results: { organic: images },
        },
      },
    ],
  } = data;

  return next({
    outputs: { images: images.slice(0, 6).map(({ image }) => image) },
    cost: costs({ env }),
  });
}
