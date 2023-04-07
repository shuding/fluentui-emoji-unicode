const fs = require("fs/promises");
const path = require("path");

async function getAllEmojiTypes() {
  return (await fs.readdir("./", { withFileTypes: true }))
    .filter((dir) => dir.isDirectory())
    .map((dir) => dir.name);
}

async function processEmojiType(name) {
  const meta = JSON.parse(
    (await fs.readFile(`./${name}/metadata.json`)).toString()
  );
  const { unicodeSkintones, unicode, glyph } = meta;
  if (unicodeSkintones) {
    let hasSkinToneFolder;

    try {
      await fs.stat(`./${name}/Default`);
      hasSkinToneFolder = true;
    } catch {
      hasSkinToneFolder = false;
    }

    for (let i = 0; i < unicodeSkintones.length; i++) {
      const skintoneCode = unicodeSkintones[i];
      const skintoneName = [
        "Default",
        "Light",
        "Medium-Light",
        "Medium",
        "Medium-Dark",
        "Dark",
      ][i];
      const glyphMod = String.fromCodePoint(
        ...skintoneCode.split(" ").map((c) => parseInt(c, 16))
      );

      await copyEmoji(
        `./${name}${hasSkinToneFolder ? "/" + skintoneName : ""}`,
        [
          // 🧑🏻‍🎨_flat.svg
          __dirname + "/" + glyphMod + "_",
          // 1f9d1-1f3fb-200d-1f3a8_flat.svg
          __dirname + "/" + skintoneCode.replaceAll(" ", "-") + "_",
        ]
      );
    }
  } else {
    await copyEmoji(`./${name}`, [
      // 🥇_flat.svg
      __dirname + "/" + glyph + "_",
      // 1f947_flat.svg
      __dirname +
        "/" +
        unicode
          .split(" ")
          .filter((code) => code !== "fe0f")
          .join("-") +
        "_",
    ]);
  }

  // Remove original folder
  await fs.rmdir(`./${name}`, { recursive: true });
}

async function copyEmoji(dir, outputPrefixes) {
  try {
    const types = (await fs.readdir(dir, { withFileTypes: true }))
      .filter((dir) => dir.isDirectory())
      .map((dir) => dir.name);

    for (const type of types) {
      const image = (await fs.readdir(path.join(dir, type)))[0];
      if (image) {
        const ext = path.extname(image);
        for (const prefix of outputPrefixes) {
          await fs.copyFile(
            path.join(dir, type, image),
            prefix + type.toLowerCase().replaceAll(" ", "-") + ext
          );
        }
      }
    }
  } catch {}
}

async function main() {
  const types = await getAllEmojiTypes();
  for (let i = 0; i < types.length; i++) {
    await processEmojiType(types[i]);
    console.log(`Processed ${i + 1}/${types.length}`);
  }
}

main();
