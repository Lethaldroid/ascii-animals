import { readFile } from "node:fs/promises";
import { build } from "vite";

const packageInfo = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const license = await readFile(new URL("../LICENSE", import.meta.url), "utf8");

await build({
  base: "./",
  build: { outDir: "dist-extension", emptyOutDir: true },
  plugins: [{
    name: "ascii-animals-extension",
    transformIndexHtml(html) {
      return html
        .replace(/^[ \t]*<link[^>]+fonts\.googleapis\.com[^>]+>\r?\n/gm, "")
        .replace("<title>ascii animals</title>", "<title>ASCII Animals · New Tab</title>");
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify({
          manifest_version: 3,
          name: "ASCII Animals New Tab",
          version: packageInfo.version,
          description: "A different animated ASCII animal in its habitat on every new tab.",
          chrome_url_overrides: { newtab: "index.html" },
        }, null, 2) + "\n",
      });
      this.emitFile({ type: "asset", fileName: "LICENSE", source: license });
    },
  }],
});
