export async function catchError(res) {
  if (!res.ok) {
    const errorText = await res.text();
    throwError.fatal(`Replicate API error ${res.status}: ${errorText}`);
  }
}

export function getOutput(data) {
  const { status, error, output } = data;
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
