export class FatalError extends Error {
  constructor(message) {
    super(message);
  }
}

export function fitSize(imageSize, aspectRatio) {
  const [w, h] = imageSize.split(":");
  if (w === "auto") {
    const target = parseInt(h);
    return { height: target, width: Math.ceil(target * aspectRatio) };
  }

  if (h === "auto") {
    const target = parseInt(w);
    return { width: target, height: Math.ceil(target * aspectRatio) };
  }

  throw new FatalError(`Wrong image size format: ${imageSize}`);
}

export class ArtWorks {
  options = {};
  constructor(options) {
    this.options = options;
  }

  getUrl(path) {
    const { baseUrl } = this.options;
    return `${baseUrl}/api/v3/${path}`;
  }

  async createTask(payload) {
    const { username, password } = this.options;

    console.log(JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(this.getUrl("tasks"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const { errors } = data;
        if (errors?.length > 0) {
          throw new FatalError(errors.join(", "));
        }
        throw new FatalError(response.statusText);
      }

      const data = await response.json();
      const { id } = data;
      return id;
    } catch (e) {
      if (e instanceof FatalError) {
        throw e;
      }
      throw new FatalError(e.message);
    }
  }

  async cancelTask(id) {
    const { username, password } = this.options;
    console.debug(`Cancel task ${id}`);
    try {
      const response = await fetch(this.getUrl(`tasks/${id}/cancel`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const { errors } = data;
        if (errors?.length > 0) {
          throw new FatalError(errors.join(", "));
        }
        throw new FatalError(response.statusText);
      }
    } catch (e) {
      if (e instanceof FatalError) {
        throw e;
      }
      throw new FatalError(e.message);
    }
  }

  async checkState(id) {
    const { username, password } = this.options;

    const response = await fetch(this.getUrl(`tasks/${id}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${username}:${password}`)}`,
      },
    });

    if (!response.ok) {
      throw new FatalError(response.statusText);
    }

    const data = await response.json();
    const { status, results } = data;
    switch (status) {
      case "preparing":
      case "scheduling":
      case "scheduled":
      case "pending":
      case "processing":
        return null;
      case "completed": {
        const { data } = results;
        return data;
      }
      case "failed": {
        const { error } = results;
        throw new FatalError(error);
      }
      default:
        throw new FatalError("Wrong task status");
    }
  }
}
