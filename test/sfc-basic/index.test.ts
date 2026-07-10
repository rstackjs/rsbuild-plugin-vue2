import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@rstest/playwright';
import { createRsbuild, loadConfig } from '@rsbuild/core';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('should build basic Vue sfc correctly', async ({ page }) => {
  const rsbuild = await createRsbuild({
    cwd: __dirname,
    rsbuildConfig: (await loadConfig({ cwd: __dirname })).content,
  });

  await rsbuild.build();
  const { server, urls } = await rsbuild.preview();

  await page.goto(urls[0]);

  const button1 = page.locator('#button1');
  const button2 = page.locator('#button2');
  const list1 = page.locator('.list1');

  await expect(button1).toHaveText('A: 0');
  await expect(button2).toHaveText('B: 0');
  await expect(list1).toHaveCount(3);

  await server.close();
});
