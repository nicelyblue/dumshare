import { describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('tailwind setup integrity', () => {
  test('tailwind and babel configuration include NativeWind wiring', () => {
    const tailwindConfig = readFileSync(resolve(process.cwd(), 'tailwind.config.js'), 'utf8');
    const babelConfig = readFileSync(resolve(process.cwd(), 'babel.config.cjs'), 'utf8');

    expect(tailwindConfig).toContain("nativewind/preset");
    expect(tailwindConfig).toContain('content');
    expect(babelConfig).toContain('nativewind/babel');
  });

  test('critical migrated UI files use utility className styling', () => {
    const labeledField = readFileSync(resolve(process.cwd(), 'src/ui/LabeledField.tsx'), 'utf8');
    const searchableSelect = readFileSync(resolve(process.cwd(), 'src/ui/SearchableSelect.tsx'), 'utf8');
    const ledgerSetup = readFileSync(resolve(process.cwd(), 'src/screens/LedgerSetupScreen.tsx'), 'utf8');

    expect(labeledField).toContain('className=');
    expect(searchableSelect).toContain('className=');
    expect(ledgerSetup).toContain('className=');
  });
});
