import { defineConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginVue2 } from '@rsbuild/plugin-vue2';
import { getRandomPort } from '@rstackjs/test-utils';

export default defineConfig({
  plugins: [pluginVue2(), pluginLess()],
  server: {
    port: await getRandomPort(),
  },
});
