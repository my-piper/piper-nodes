const { runNode } = require("@piper/node");
import { run } from "./script";
import { writeFile } from "fs/promises";

test("should compose layers", async () => {
  const { image } = await runNode(run, {
    image1: "https://picsum.photos/100/100",
    image2: "https://picsum.photos/100/100",
    text: "Hello World",
    config: {
      canvas: { width: 800, height: 600 },
      layers: {
        image1: {
          type: "image",
          x: 50,
          y: 50,
          width: 100,
          height: 100,
        },
        image2: {
          type: "image",
          x: 200,
          y: 200,
          width: 50,
          height: 50,
        },
        text: {
          type: "text",
          x: 100,
          y: 50,
          fontSize: 53,
          color: "#ffffff",
          fontFamily: "'Comic Sans MS', cursive",
          fontWeight: "bold",
          backgroundColor: "#bd0000",
        },
      },
    },
  });
  await writeFile("./tmp/composer.png", image);
});
