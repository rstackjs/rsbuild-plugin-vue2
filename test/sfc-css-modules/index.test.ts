import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/playwright';
import { createRsbuild, loadConfig } from '@rsbuild/core';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should build Vue sfc with CSS Modules correctly in prod build', async ({
  page,
}) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: (await loadConfig({ cwd: __dirname })).content,
  });

  await rsbuild.build();
  const { server, urls } = await rsbuild.preview();

  await page.goto(urls[0]);

  const test1 = page.locator('#test1');
  const test2 = page.locator('#test2');
  const test3 = page.locator('#test3');

  await expect(test1).toHaveCSS('color', 'rgb(255, 0, 0)');
  await expect(test2).toHaveCSS('color', 'rgb(0, 0, 255)');
  await expect(test3).toHaveCSS('color', 'rgb(0, 128, 0)');

  await server.close();
});
