# @rsbuild/plugin-vue2

Provides support for Vue 2 SFC (Single File Components). The plugin internally integrates [vue-loader](https://vue-loader.vuejs.org/) v15.

> @rsbuild/plugin-vue2 only supports Vue >= 2.7.0.

<p>
  <a href="https://npmjs.com/package/@rsbuild/plugin-vue2">
   <img src="https://img.shields.io/npm/v/@rsbuild/plugin-vue2?style=flat-square&colorA=564341&colorB=EDED91" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square&colorA=564341&colorB=EDED91" alt="license" />
</p>

## Usage

Install:

```bash
npm add @rsbuild/plugin-vue2 -D
```

Add plugin to your `rsbuild.config.ts`:

```ts
// rsbuild.config.ts
import { pluginVue2 } from '@rsbuild/plugin-vue2';

export default {
  plugins: [pluginVue2()],
};
```

After registering the plugin, you can import `*.vue` files in your code.

## Options

If you need to customize the compilation behavior of Vue, you can use the following configs.

### vueLoaderOptions

Options passed to `vue-loader`, please refer to the [vue-loader documentation](https://vue-loader.vuejs.org/) for detailed usage.

- **Type:** `VueLoaderOptions`
- **Default:**

```js
const defaultOptions = {
  compilerOptions: {
    whitespace: 'condense',
  },
  experimentalInlineMatchResource: true,
};
```

- **Example:**

```ts
pluginVue2({
  vueLoaderOptions: {
    hotReload: false,
  },
});
```

> The Vue 2 plugin is using the `vue-loader` v15. Please be aware that there may be configuration differences between v15 and the latest version.

### splitChunks

When [chunkSplit.strategy](/config/performance/chunk-split) set to `split-by-experience`, Rsbuild will automatically split `vue` and `router` related packages into separate chunks by default:

- `lib-vue.js`: includes vue, vue-loader.
- `lib-router.js`: includes vue-router.

This option is used to control this behavior and determine whether the `vue` and `router` related packages need to be split into separate chunks.

- **Type:**

```ts
type SplitVueChunkOptions = {
  vue?: boolean;
  router?: boolean;
};
```

- **Default:**

```ts
const defaultOptions = {
  vue: true,
  router: true,
};
```

- **Example:**

```ts
pluginVue({
  splitChunks: {
    vue: false,
    router: false,
  },
});
```

## FAQ

### /deep/ selector causes compilation error

`/deep/` is a deprecated usage as of Vue v2.7. Since it is not a valid CSS syntax, CSS compilation tools like Lightning CSS will fail to compile it.

You can use `:deep()` instead. See [Vue - Deep Selectors](https://vuejs.org/api/sfc-css-features.html#deep-selectors) for more details.

```html
<style scoped>
  .a :deep(.b) {
    /* ... */
  }
</style>
```

> You can also refer to [Vue - RFC 0023](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0023-scoped-styles-changes.md) for more details.

## License

[MIT](./LICENSE).
