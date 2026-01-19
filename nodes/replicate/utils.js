import { throwError } from "../../utils/node.js";

export async function catchError(res) {
  if (!res.ok) {
    const errorText = await res.text();
    throwError.fatal(`Replicate API error ${res.status}: ${errorText}`);
  }
}

const BASE_URL = "https://api.replicate.com";

export async function predict({ apiToken, version = "v1" }, endpoint, payload) {
  const url = [BASE_URL, version, endpoint].join("/");
  console.log("Sending request to", url);
  console.log(JSON.stringify(payload, null, 2));
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: payload,
    }),
  });

  await catchError(res);
  const { id: task } = await res.json();
  return task;
}

export async function getOutput({ apiToken, version = "v1" }, task) {
  const url = [BASE_URL, version, `predictions/${task}`].join("/");
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
  });
  await catchError(res);

  const { status, error, output } = await res.json();
  switch (status) {
    case "starting":
    case "processing":
      return null;
    case "failed":
    case "canceled":
      catchError(error);
    case "succeeded":
      return output;
    default:
      throwError.fatal(`Unknown status: ${status}`);
  }
}
