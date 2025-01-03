import { isAbsolute } from "path";
import { fileURLToPath, pathToFileURL } from "node:url";
import fs from "fs";
import { createUnplugin } from "unplugin";

export default createUnplugin((options) => ({
  name: "unplugin-phecda-server",
  enforce: "pre",
  async buildStart() {
    process.env.PS_HMR_BAN = "true";

    const { initialize } = await import("phecda-server/register/loader.mjs");

    await initialize();
  },

  async resolveId(id, i) {
    if (id.includes("node_modules")) return;
    const { resolve } = await import("phecda-server/register/loader.mjs");
    const { url } = await resolve(
      id,
      { parentURL: i && pathToFileURL(i).href },
      () => {
        return {};
      }
    );

    if (url) {
      if (/^file:\/\/\//.test(url)) return fileURLToPath(url);
      return url;
    }
  },
  async load(id) {
    if (id.includes("node_modules")) return;

    try {// if load internal virtual files provided by webpack/vite... throw err and we skip
      const { load } = await import("phecda-server/register/loader.mjs");

      const { source } = await load(id, {
        importAttributes:{}
      }, async () => {
        const source = await fs.promises.readFile(id);
        return {
          source,
        };
      });

      return Buffer.from(source).toString();
    } catch (e) { }
  },

  vite: {
    apply: "build",
    config(config) {
      return {
        esbuild: false,
        build: {
          ssr: config.build?.ssr || true,
        },
      };
    },
  },
  // more hooks coming
}));
