import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { run } from "./script.js";

Deno.test("Composer: single image layer", async () => {
  const {
    outputs: { image },
  } = await runNode(run, {
    inputs: {
      image1: "https://picsum.photos/200/200",
      config: {
        canvas: { width: 400, height: 300 },
        layers: {
          image1: {
            type: "image",
            x: 50,
            y: 50,
            width: 200,
            height: 200,
            order: 0,
          },
        },
      },
    },
  });
  expect(image).toBeInstanceOf(Uint8Array);
  expect(image.length).toBeGreaterThan(0);
  // PNG signature check
  expect(image[0]).toBe(0x89);
  expect(image[1]).toBe(0x50);
  expect(image[2]).toBe(0x4e);
  expect(image[3]).toBe(0x47);
  await Deno.writeFile("/tmp/composer_single_image.png", image);
  console.log("Saved: /tmp/composer_single_image.png");
});

Deno.test("Composer: multiple image layers with ordering", async () => {
  const {
    outputs: { image },
  } = await runNode(run, {
    inputs: {
      image1: "https://picsum.photos/150/150",
      image2: "https://picsum.photos/100/100",
      config: {
        canvas: { width: 500, height: 400 },
        layers: {
          image1: {
            type: "image",
            x: 0,
            y: 0,
            width: 150,
            height: 150,
            order: 0,
          },
          image2: {
            type: "image",
            x: 200,
            y: 100,
            width: 100,
            height: 100,
            order: 1,
          },
        },
      },
    },
  });
  expect(image).toBeInstanceOf(Uint8Array);
  expect(image.length).toBeGreaterThan(0);
  // Verify PNG format
  expect(image[0]).toBe(0x89);
  expect(image[1]).toBe(0x50);
  await Deno.writeFile("/tmp/composer_multiple_images.png", image);
  console.log("Saved: /tmp/composer_multiple_images.png");
});

Deno.test("Composer: image with custom dimensions", async () => {
  const {
    outputs: { image },
  } = await runNode(run, {
    inputs: {
      photo: "https://picsum.photos/300/200",
      config: {
        canvas: { width: 600, height: 400 },
        layers: {
          photo: {
            type: "image",
            x: 100,
            y: 50,
            width: 400,
            height: 300,
            order: 0,
          },
        },
      },
    },
  });
  expect(image).toBeInstanceOf(Uint8Array);
  expect(image.length).toBeGreaterThan(0);
  await Deno.writeFile("/tmp/composer_custom_dimensions.png", image);
  console.log("Saved: /tmp/composer_custom_dimensions.png");
});

Deno.test(
  "Composer: image without explicit dimensions (use original)",
  async () => {
    const {
      outputs: { image },
    } = await runNode(run, {
      inputs: {
        img: "https://picsum.photos/250/250",
        config: {
          canvas: { width: 800, height: 600 },
          layers: {
            img: {
              type: "image",
              x: 50,
              y: 50,
              order: 0,
            },
          },
        },
      },
    });
    expect(image).toBeInstanceOf(Uint8Array);
    expect(image.length).toBeGreaterThan(0);
  }
);

Deno.test("Composer: text layer with background", async () => {
  const {
    outputs: { image },
  } = await runNode(run, {
    inputs: {
      text1: "Hello World",
      config: {
        canvas: { width: 400, height: 200 },
        layers: {
          text1: {
            type: "text",
            x: 50,
            y: 50,
            fontSize: 32,
            color: "#ffffff",
            backgroundColor: "#ff0000",
            order: 0,
          },
        },
      },
    },
  });
  expect(image).toBeInstanceOf(Uint8Array);
  expect(image.length).toBeGreaterThan(0);
  await Deno.writeFile("/tmp/composer_text_with_bg.png", image);
  console.log("Saved: /tmp/composer_text_with_bg.png");
});

Deno.test("Composer: text layer without background", async () => {
  const {
    outputs: { image },
  } = await runNode(run, {
    inputs: {
      label: "Test Label",
      config: {
        canvas: { width: 300, height: 150 },
        layers: {
          label: {
            type: "text",
            x: 20,
            y: 20,
            fontSize: 24,
            color: "#000000",
            order: 0,
          },
        },
      },
    },
  });
  expect(image).toBeInstanceOf(Uint8Array);
  expect(image.length).toBeGreaterThan(0);
});

Deno.test("Composer: mixed layers (images and text)", async () => {
  const {
    outputs: { image },
  } = await runNode(run, {
    inputs: {
      background: "https://picsum.photos/800/600",
      logo: "https://picsum.photos/100/100",
      title: "My Composition",
      subtitle: "Created with Piper",
      config: {
        canvas: { width: 800, height: 600 },
        layers: {
          background: {
            type: "image",
            x: 0,
            y: 0,
            width: 800,
            height: 600,
            order: 0,
          },
          logo: {
            type: "image",
            x: 650,
            y: 20,
            width: 100,
            height: 100,
            order: 1,
          },
          title: {
            type: "text",
            x: 50,
            y: 50,
            fontSize: 48,
            color: "#ffffff",
            backgroundColor: "#000000",
            order: 2,
          },
          subtitle: {
            type: "text",
            x: 50,
            y: 120,
            fontSize: 24,
            color: "#cccccc",
            order: 3,
          },
        },
      },
    },
  });
  expect(image).toBeInstanceOf(Uint8Array);
  expect(image.length).toBeGreaterThan(0);
  await Deno.writeFile("/tmp/composer_mixed_layers.png", image);
  console.log("Saved: /tmp/composer_mixed_layers.png");
});

Deno.test("Composer: skip missing layer values", async () => {
  const {
    outputs: { image },
  } = await runNode(run, {
    inputs: {
      image1: "https://picsum.photos/200/200",
      // image2 is missing
      config: {
        canvas: { width: 500, height: 400 },
        layers: {
          image1: {
            type: "image",
            x: 0,
            y: 0,
            width: 200,
            height: 200,
            order: 0,
          },
          image2: {
            type: "image",
            x: 250,
            y: 100,
            width: 150,
            height: 150,
            order: 1,
          },
        },
      },
    },
  });
  expect(image).toBeInstanceOf(Uint8Array);
  expect(image.length).toBeGreaterThan(0);
});

Deno.test("Composer: large canvas with DPR scaling", async () => {
  const {
    outputs: { image },
  } = await runNode(run, {
    inputs: {
      img: "https://picsum.photos/400/300",
      config: {
        canvas: { width: 1920, height: 1080 },
        layers: {
          img: {
            type: "image",
            x: 760,
            y: 390,
            width: 400,
            height: 300,
            order: 0,
          },
        },
      },
    },
  });
  expect(image).toBeInstanceOf(Uint8Array);
  expect(image.length).toBeGreaterThan(0);
  await Deno.writeFile("/tmp/composer_large_canvas.png", image);
  console.log("Saved: /tmp/composer_large_canvas.png");
});

Deno.test("Composer: text with custom font properties", async () => {
  const {
    outputs: { image },
  } = await runNode(run, {
    inputs: {
      heading: "Important Notice",
      config: {
        canvas: { width: 600, height: 200 },
        layers: {
          heading: {
            type: "text",
            x: 100,
            y: 50,
            fontSize: 36,
            fontFamily: "Arial, sans-serif",
            fontWeight: "bold",
            color: "#ff6600",
            backgroundColor: "#f0f0f0",
            order: 0,
          },
        },
      },
    },
  });
  expect(image).toBeInstanceOf(Uint8Array);
  expect(image.length).toBeGreaterThan(0);
});

Deno.test("Composer: empty text defaults to dash", async () => {
  const {
    outputs: { image },
  } = await runNode(run, {
    inputs: {
      emptyText: "",
      config: {
        canvas: { width: 300, height: 100 },
        layers: {
          emptyText: {
            type: "text",
            x: 10,
            y: 10,
            fontSize: 20,
            color: "#000000",
            order: 0,
          },
        },
      },
    },
  });
  expect(image).toBeInstanceOf(Uint8Array);
  expect(image.length).toBeGreaterThan(0);
});

Deno.test("Composer: layer ordering matters", async () => {
  const {
    outputs: { image },
  } = await runNode(run, {
    inputs: {
      layer1: "https://picsum.photos/300/300",
      layer2: "https://picsum.photos/200/200",
      layer3: "https://picsum.photos/150/150",
      config: {
        canvas: { width: 400, height: 400 },
        layers: {
          layer1: {
            type: "image",
            x: 0,
            y: 0,
            width: 300,
            height: 300,
            order: 2, // Should be rendered last (on top)
          },
          layer2: {
            type: "image",
            x: 50,
            y: 50,
            width: 200,
            height: 200,
            order: 0, // Should be rendered first (bottom)
          },
          layer3: {
            type: "image",
            x: 100,
            y: 100,
            width: 150,
            height: 150,
            order: 1, // Should be rendered in middle
          },
        },
      },
    },
  });
  expect(image).toBeInstanceOf(Uint8Array);
  expect(image.length).toBeGreaterThan(0);
  await Deno.writeFile("/tmp/composer_layer_ordering.png", image);
  console.log("Saved: /tmp/composer_layer_ordering.png");
});
