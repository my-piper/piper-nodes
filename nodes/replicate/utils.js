export async function catchError(res) {
  if (!res.ok) {
    const errorText = await res.text();
    throwError.fatal(`Replicate API error ${res.status}: ${errorText}`);
  }
}

export async function predict({ apiToken }, endpoint, payload) {
  console.log("Sending request to", endpoint);
  console.log(JSON.stringify(payload, null, 2));
  const res = await fetch(endpoint, {
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

export async function getOutput({ apiToken }, task) {
  const res = await fetch(`https://api.replicate.com/v1/predictions/${task}`, {
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
