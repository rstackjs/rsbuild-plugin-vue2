import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const PATCHED_RULE_SET_COMPILER = '__rsbuildPluginVue2PatchedWithRule';

type RuleSetPlugin = {
  ruleProperty?: string;
};

type RuleSetCompilerConstructor = {
  new (plugins?: RuleSetPlugin[]): object;
  [PATCHED_RULE_SET_COMPILER]?: true;
};

type ObjectMatcherRulePluginConstructor = new (
  ruleProperty: string,
  dataProperty?: string,
  additionalConditionFunction?: (value: unknown) => boolean,
) => RuleSetPlugin;

/**
 * vue-loader@15 uses webpack's RuleSetCompiler to clone user rules, while
 * Rspack supports `rule.with` for import attributes before webpack does.
 */
export function patchWebpackRuleSetCompiler() {
  // vue-loader@15 requires webpack's RuleSetCompiler lazily from its plugin,
  // so patch the module export before constructing VueLoaderPlugin.
  const ruleSetCompilerPath =
    require.resolve('webpack/lib/rules/RuleSetCompiler');
  const ObjectMatcherRulePlugin =
    require('webpack/lib/rules/ObjectMatcherRulePlugin') as ObjectMatcherRulePluginConstructor;
  const RuleSetCompiler = require(
    ruleSetCompilerPath,
  ) as RuleSetCompilerConstructor;

  if (RuleSetCompiler[PATCHED_RULE_SET_COMPILER]) {
    return;
  }

  class PatchedRuleSetCompiler extends RuleSetCompiler {
    constructor(plugins: RuleSetPlugin[] = []) {
      // Newer webpack versions already support `with`; avoid installing the
      // same matcher twice if vue-loader eventually gains it upstream.
      const hasWithRule = plugins.some(
        (plugin) => plugin?.ruleProperty === 'with',
      );

      super(
        hasWithRule
          ? plugins
          : [
              ...plugins,
              // Rspack stores import attributes in `attributes`, matching
              // webpack's own NormalModuleFactory rule compiler behavior.
              new ObjectMatcherRulePlugin('with', 'attributes', (value) =>
                Boolean(
                  value &&
                  !(value as { _isLegacyAssert?: unknown })._isLegacyAssert,
                ),
              ),
            ],
      );
    }
  }

  PatchedRuleSetCompiler[PATCHED_RULE_SET_COMPILER] = true;

  // Replace the cached export so vue-loader's later `require()` receives the
  // patched constructor while the original package files remain untouched.
  const cachedModule = require.cache[ruleSetCompilerPath];
  if (cachedModule) {
    cachedModule.exports = PatchedRuleSetCompiler;
  }
}
