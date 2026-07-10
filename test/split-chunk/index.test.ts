import { existsSync } from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/playwright';
import { createRsbuild } from '@rsbuild/core';
import { type PluginVueOptions, pluginVue2 } from '../../dist';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should split vue chunks correctly', async () => {
  const buildRsbuild = (options?: PluginVueOptions) => {
    return createRsbuild({
      cwd: __dirname,
      rsbuildConfig: {
        plugins: [pluginVue2(options)],
        output: {
          filenameHash: false,
        },
      },
    });
  };

  // default true
  let rsbuild = await buildRsbuild();
  await rsbuild.build();
  let libVuePath = path.join(__dirname, 'dist', 'static/js/lib-vue.js');
  expect(existsSync(libVuePath)).toBeTruthy();

  // manual turn off
  rsbuild = await buildRsbuild({ splitChunks: { vue: false } });
  await rsbuild.build();
  libVuePath = path.join(__dirname, 'dist', 'static/js/lib-vue.js');
  expect(existsSync(libVuePath)).toBeFalsy();

  // manual turn on
  rsbuild = await buildRsbuild({ splitChunks: { vue: true, router: false } });
  await rsbuild.build();
  libVuePath = path.join(__dirname, 'dist', 'static/js/lib-vue.js');
  expect(existsSync(libVuePath)).toBeTruthy();
});

test('should not split vue chunks when strategy is `all-in-one`', async () => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: {
      plugins: [pluginVue2()],
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
      output: {
        filenameHash: false,
      },
    },
  });

  await rsbuild.build();

  const libVuePath = path.join(__dirname, 'dist', 'static/js/lib-vue.js');
  expect(existsSync(libVuePath)).toBeFalsy();
});
