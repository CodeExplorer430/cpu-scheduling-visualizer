import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const localeDir = path.resolve(process.cwd(), 'src/locales');

const getKeys = (obj: Record<string, unknown>): string[] => Object.keys(obj || {});

describe('Locale consistency', () => {
  it('all locales should include required algorithm and generator keys', () => {
    const en = JSON.parse(fs.readFileSync(path.join(localeDir, 'en.json'), 'utf-8'));

    const requiredAlgorithmKeys = getKeys(en.controls.algorithms);
    const requiredGeneratorTypeKeys = getKeys(en.generator.types);

    const localeFiles = fs.readdirSync(localeDir).filter((file) => file.endsWith('.json'));

    for (const localeFile of localeFiles) {
      const locale = JSON.parse(fs.readFileSync(path.join(localeDir, localeFile), 'utf-8'));
      const algorithmKeys = getKeys(locale.controls?.algorithms || {});
      const generatorTypeKeys = getKeys(locale.generator?.types || {});

      for (const key of requiredAlgorithmKeys) {
        expect(algorithmKeys, `${localeFile} missing controls.algorithms.${key}`).toContain(key);
      }

      for (const key of requiredGeneratorTypeKeys) {
        expect(generatorTypeKeys, `${localeFile} missing generator.types.${key}`).toContain(key);
      }
    }
  });
});
