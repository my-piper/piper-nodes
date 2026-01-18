const { runNode } = require("@piper/node");
import { run } from "./script";

test.only("should make video", async () => {
  const { video } = await runNode(run, {
    video1:
      "https://huggingface.co/PiperMy/Pipelines/resolve/main/assets/persons/posing_girl.mp4",
    video2:
      "https://huggingface.co/PiperMy/Pipelines/resolve/main/assets/persons/posing_girl.mp4",
  });
  console.log(video);
  expect(video).toMatch(/^https/);
});
