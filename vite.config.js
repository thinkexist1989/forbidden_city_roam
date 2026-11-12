import {cpSync} from 'node:fs';
import {resolve} from 'node:path';
import {defineConfig} from 'vite';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'palace-model-assets',
    writeBundle({dir}) {
      for (const path of ['forbidden_city.glb', 'textures']) {
        cpSync(path, resolve(dir, path), {recursive: true});
      }
    }
  }]
});
