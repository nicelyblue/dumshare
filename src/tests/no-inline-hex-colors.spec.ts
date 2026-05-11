import { describe, expect, test } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

function listTsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const absolute = resolve(dir, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      return listTsxFiles(absolute);
    }
    return absolute.endsWith('.tsx') ? [absolute] : [];
  });
}

describe('design token guardrails', () => {
  test('tsx files avoid inline hex colors', () => {
    const files = listTsxFiles(resolve(process.cwd(), 'src'));
    const offenders: string[] = [];

    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      if (/#[0-9a-fA-F]{6}\b/.test(text)) {
        offenders.push(file.replace(`${process.cwd()}\\`, '').replaceAll('\\', '/'));
      }
    }

    expect(offenders).toEqual([]);
  });
});
