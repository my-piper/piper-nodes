const { runNode } = require("@piper/node");
import { run } from "./script";

test("should translate text", async () => {
  const { text } = await runNode(run, {
    source: "auto",
    text: "Hello",
    target: "de",
  });
  expect(text).toBe("Hallo");
});
