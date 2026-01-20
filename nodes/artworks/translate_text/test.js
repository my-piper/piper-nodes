import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

import { costs, run } from "./script.js";

Deno.test("ArtWorks Translate Text: costs calculation", () => {
  const result = costs({
    env: {
      scope: {},
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {},
  });
  expect(result.costs).toBe(0.001);
  expect(result.details).toBe("en=Price is fixed;ru=Цена фиксирована");
});

Deno.test("ArtWorks Translate Text: costs are zero for user scope", () => {
  const result = costs({
    env: {
      scope: {
        ARTWORKS_USER: "user",
      },
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {},
  });
  expect(result).toBe(0);
});

Deno.test("ArtWorks Translate Text: translate English to Russian", async () => {
  const {
    costs: resultCosts,
    outputs: { text },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {
      source: "en",
      target: "ru",
      text: "Hello, how are you?",
    },
  });
  console.log("Translated text (EN->RU):", text);
  expect(typeof text).toBe("string");
  expect(text.length).toBeGreaterThan(0);
  expect(resultCosts.costs).toBe(0.001);
});

Deno.test("ArtWorks Translate Text: translate Russian to English", async () => {
  const {
    costs: resultCosts,
    outputs: { text },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {
      source: "ru",
      target: "en",
      text: "Привет, как дела?",
    },
  });
  console.log("Translated text (RU->EN):", text);
  expect(typeof text).toBe("string");
  expect(text.length).toBeGreaterThan(0);
  // Translation can vary: "Hello", "Hey", "Hi", etc.
  expect(text.toLowerCase()).toMatch(/h(ello|ey|i)/);
  expect(resultCosts.costs).toBe(0.001);
});

Deno.test("ArtWorks Translate Text: auto-detect source language", async () => {
  const {
    costs: resultCosts,
    outputs: { text },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {
      source: "auto",
      target: "en",
      text: "Bonjour, comment allez-vous?",
    },
  });
  console.log("Translated text (auto->EN):", text);
  expect(typeof text).toBe("string");
  expect(text.length).toBeGreaterThan(0);
  expect(resultCosts.costs).toBe(0.001);
});

Deno.test("ArtWorks Translate Text: translate Spanish to German", async () => {
  const {
    costs: resultCosts,
    outputs: { text },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {
      source: "es",
      target: "de",
      text: "Hola, ¿cómo estás?",
    },
  });
  console.log("Translated text (ES->DE):", text);
  expect(typeof text).toBe("string");
  expect(text.length).toBeGreaterThan(0);
  expect(resultCosts.costs).toBe(0.001);
});

Deno.test("ArtWorks Translate Text: translate long text", async () => {
  const {
    costs: resultCosts,
    outputs: { text },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {
      source: "en",
      target: "fr",
      text: "The quick brown fox jumps over the lazy dog. This is a test of the translation service with a longer text to ensure it handles multiple sentences correctly.",
    },
  });
  console.log("Translated long text (EN->FR):", text);
  expect(typeof text).toBe("string");
  expect(text.length).toBeGreaterThan(0);
  expect(resultCosts.costs).toBe(0.001);
});

Deno.test(
  "ArtWorks Translate Text: translate Japanese to English",
  async () => {
    const {
      costs: resultCosts,
      outputs: { text },
    } = await runNode(run, {
      env: {
        scope: {},
        variables: {
          ARTWORKS_USER,
          ARTWORKS_PASSWORD,
        },
      },
      inputs: {
        source: "ja",
        target: "en",
        text: "こんにちは、元気ですか？",
      },
    });
    console.log("Translated text (JA->EN):", text);
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
    expect(resultCosts.costs).toBe(0.001);
  }
);

Deno.test("ArtWorks Translate Text: translate Chinese to English", async () => {
  const {
    costs: resultCosts,
    outputs: { text },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {
      source: "zh",
      target: "en",
      text: "你好，你好吗？",
    },
  });
  console.log("Translated text (ZH->EN):", text);
  expect(typeof text).toBe("string");
  expect(text.length).toBeGreaterThan(0);
  expect(resultCosts.costs).toBe(0.001);
});
