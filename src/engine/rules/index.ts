/**
 * Rule registry.
 *
 * Adding a rule: drop a new file under rules/ exporting an array of `Rule`,
 * import it here, and push it onto `RULES`. Nothing else in the engine needs to
 * change — tests for the new rule belong in tests/engine.test.ts.
 *
 * To add a region, create rules/regionalXyz.ts exporting `regionalXyzRules` and
 * include it alongside regionalIndiaRules below.
 */

import type { Rule } from '../types';
import { credentialRules } from './credentials';
import { urgencyRules } from './urgency';
import { financialLureRules } from './financialLure';
import { impersonationRules } from './impersonation';
import { paymentRules } from './payment';
import { contactRules } from './contact';
import { languageRules } from './language';
import { regionalIndiaRules } from './regionalIndia';

export const RULES: readonly Rule[] = [
  ...credentialRules,
  ...urgencyRules,
  ...financialLureRules,
  ...impersonationRules,
  ...paymentRules,
  ...contactRules,
  ...languageRules,
  ...regionalIndiaRules,
];

export {
  credentialRules,
  urgencyRules,
  financialLureRules,
  impersonationRules,
  paymentRules,
  contactRules,
  languageRules,
  regionalIndiaRules,
};

/** Total number of static rules, exposed for the About page. */
export const RULE_COUNT = RULES.length;

/** Every rule id, used by the engine self-check in tests. */
export const RULE_IDS: readonly string[] = RULES.map((r) => r.id);
