import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const PATCHED_RULE_SET_COMPILER = '__rsbuildPluginVue2PatchedWithRule';

type RuleSetPlugin = {
  ruleProperty?: string;
};

type RuleSetCondition = {
  property: string;
  fn: (value: string) => boolean;
};

type RuleSetCompilerConstructor = {
  new (plugins?: RuleSetPlugin[]): {
    compileRule(...args: unknown[]): { conditions: RuleSetCondition[] };
  };
  [PATCHED_RULE_SET_COMPILER]?: true;
};

type BasicMatcherRulePluginConstructor = new (
  ruleProperty: string,
) => RuleSetPlugin;

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
  const BasicMatcherRulePlugin =
    require('webpack/lib/rules/BasicMatcherRulePlugin') as BasicMatcherRulePluginConstructor;
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

      super([
        ...plugins,
        new BasicMatcherRulePlugin('phase'),
        ...(hasWithRule
          ? []
          : [
              // Rspack stores import attributes in `attributes`, matching
              // webpack's own NormalModuleFactory rule compiler behavior.
              new ObjectMatcherRulePlugin('with', 'attributes', (value) =>
                Boolean(
                  value &&
                  !(value as { _isLegacyAssert?: unknown })._isLegacyAssert,
                ),
              ),
            ]),
      ]);
    }

    compileRule(...args: unknown[]) {
      const rule = super.compileRule(...args);
      // vue-loader@15 evaluates conditions of cloned rules against a fake
      // resource path. Language blocks are always imported through a regular
      // import, so match `phase` against `evaluation`, like rspack-vue-loader.
      for (const condition of rule.conditions) {
        if (condition.property === 'phase') {
          const { fn } = condition;
          condition.fn = () => fn('evaluation');
        }
      }
      return rule;
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
