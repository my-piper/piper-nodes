#!/usr/bin/env -S deno run --allow-read

import { parse } from "https://deno.land/std@0.224.0/yaml/mod.ts";

const TARGET_DIR = Deno.args[0] || "nodes/artworks";

async function getSchemaInputs(nodePath) {
  const schemaPath = `${nodePath}/schema.yaml`;
  try {
    const content = await Deno.readTextFile(schemaPath);
    const schema = parse(content);
    return Object.keys(schema.inputs || {});
  } catch (e) {
    return null;
  }
}

async function getScriptInputs(nodePath) {
  const scriptPath = `${nodePath}/script.js`;
  try {
    const content = await Deno.readTextFile(scriptPath);

    // Find all destructured inputs from the inputs object
    const inputsPattern = /const\s*{([^}]+)}\s*=\s*inputs/g;
    const matches = [...content.matchAll(inputsPattern)];

    const inputs = new Set();
    for (const match of matches) {
      const destructured = match[1];
      // Split by comma and extract variable names
      const vars = destructured
        .split(",")
        .map((v) => {
          // Remove comments
          const withoutComments = v.replace(/\/\/.*$/gm, "").trim();
          if (!withoutComments) return null;

          // Handle cases like "prompt = 'default'" or "imageSize: size"
          const cleaned = withoutComments.split(/[=:]/)[0].trim();
          return cleaned;
        })
        .filter((v) => v && v.length > 0);

      vars.forEach((v) => inputs.add(v));
    }

    return Array.from(inputs);
  } catch (e) {
    return null;
  }
}

async function compareNode(nodeName) {
  const nodePath = `${TARGET_DIR}/${nodeName}`;

  const schemaInputs = await getSchemaInputs(nodePath);
  const scriptInputs = await getScriptInputs(nodePath);

  if (!schemaInputs || !scriptInputs) {
    return null;
  }

  const schemaSet = new Set(schemaInputs);
  const scriptSet = new Set(scriptInputs);

  const inSchemaNotScript = schemaInputs.filter((i) => !scriptSet.has(i));
  const inScriptNotSchema = scriptInputs.filter((i) => !schemaSet.has(i));

  return {
    nodeName,
    schemaInputs: schemaInputs.sort(),
    scriptInputs: scriptInputs.sort(),
    inSchemaNotScript,
    inScriptNotSchema,
    hasIssues: inSchemaNotScript.length > 0 || inScriptNotSchema.length > 0,
  };
}

// Get all node directories
const nodes = [];
for await (const entry of Deno.readDir(TARGET_DIR)) {
  if (entry.isDirectory && entry.name !== "utils.js") {
    nodes.push(entry.name);
  }
}

console.log(
  `Comparing schema.yaml inputs with script.js inputs for ${TARGET_DIR} nodes...\n`
);

const results = [];
for (const node of nodes.sort()) {
  const result = await compareNode(node);
  if (result) {
    results.push(result);
  }
}

// Print results
const issues = results.filter((r) => r.hasIssues);
const clean = results.filter((r) => !r.hasIssues);

if (issues.length > 0) {
  console.log(`🔴 Found ${issues.length} nodes with input mismatches:\n`);

  for (const result of issues) {
    console.log(`\n📦 ${result.nodeName}:`);
    console.log(`   Schema inputs: [${result.schemaInputs.join(", ")}]`);
    console.log(`   Script inputs: [${result.scriptInputs.join(", ")}]`);

    if (result.inSchemaNotScript.length > 0) {
      console.log(
        `   ⚠️  In schema but NOT used in script: ${result.inSchemaNotScript.join(", ")}`
      );
    }
    if (result.inScriptNotSchema.length > 0) {
      console.log(
        `   ⚠️  Used in script but NOT in schema: ${result.inScriptNotSchema.join(", ")}`
      );
    }
  }
}

if (clean.length > 0) {
  console.log(`\n\n✅ ${clean.length} nodes with matching inputs:\n`);
  for (const result of clean) {
    console.log(
      `   ✅ ${result.nodeName}: [${result.schemaInputs.join(", ")}]`
    );
  }
}

console.log(
  `\n\nSummary: ${clean.length} clean, ${issues.length} with issues, ${results.length} total`
);
