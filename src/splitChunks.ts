import type {
  NormalizedEnvironmentConfig,
  RsbuildPluginAPI,
  Rspack,
  SplitChunks,
} from '@rsbuild/core';
import type { SplitVueChunkOptions } from './index.js';

const isPlainObject = (obj: unknown): obj is Record<string, unknown> =>
  obj !== null &&
  typeof obj === 'object' &&
  Object.prototype.toString.call(obj) === '[object Object]';

const isDefaultPreset = (config: NormalizedEnvironmentConfig) => {
  const { performance, splitChunks } = config;
  // Compatible with legacy `performance.chunkSplit` option
  if (performance.chunkSplit) {
    return performance.chunkSplit?.strategy === 'split-by-experience';
  }
  if (typeof splitChunks === 'object') {
    return !splitChunks.preset || splitChunks.preset === 'default';
  }
  return false;
};

export const applySplitChunksRule = (
  api: RsbuildPluginAPI,
  options: SplitVueChunkOptions = {
    vue: true,
    router: true,
  },
): void => {
  api.modifyBundlerChain((chain, { environment }) => {
    const { config } = environment;
    if (!isDefaultPreset(config) || config.output.target !== 'web') {
      return;
    }

    const currentConfig = chain.optimization.splitChunks.values();
    if (!isPlainObject(currentConfig)) {
      return;
    }

    const extraGroups: Record<
      string,
      Rspack.OptimizationSplitChunksCacheGroup
    > = {};

    if (options.vue) {
      extraGroups.vue = {
        name: 'lib-vue',
        test: /node_modules[\\/](?:vue|vue-loader)[\\/]/,
        priority: 0,
      };
    }

    if (options.router) {
      extraGroups.router = {
        name: 'lib-router',
        test: /node_modules[\\/]vue-router[\\/]/,
        priority: 0,
      };
    }

    if (!Object.keys(extraGroups).length) {
      return;
    }

    chain.optimization.splitChunks({
      ...currentConfig,
      cacheGroups: {
        ...(currentConfig as Exclude<SplitChunks, false>).cacheGroups,
        ...extraGroups,
      },
    });
  });
};
