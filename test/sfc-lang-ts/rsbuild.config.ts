import { defineConfig } from '@rsbuild/core';
import { pluginVue2 } from '@rsbuild/plugin-vue2';
import { getRandomPort } from '../helper';

export default defineConfig({
  plugins: [pluginVue2()],
  server: {
    port: await getRandomPort(),
  },
});
