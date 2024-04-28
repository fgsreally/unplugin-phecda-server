import { createUnplugin } from "unplugin";
import {isAbsolute} from 'path'
export default createUnplugin((options) => ({
  name: "unplugin-phecda-server-bundler",

  async buildStart() {
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
    if (!isAbsolute(id)) return;
    if (id.includes("node_modules")) return;

    const { load } = await import("phecda-server/register/loader.mjs");

    const { source } = await load(id, {}, async () => {
      const source = await fs.promises.readFile(id);
      return {
        source,
      };
    });

    return Buffer.from(source).toString();
  },

  vite: {
    apply: "build",
  },
  // more hooks coming
}));
