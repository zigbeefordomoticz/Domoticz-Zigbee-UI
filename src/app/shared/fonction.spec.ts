import { describe, expect, it } from 'vitest';
import { sortAsc, sortDesc } from './fonction';

const entries = (...values: any[]) => values.map((value, i) => ({ key: String(i), value }));
const sorted = (compare: typeof sortAsc, ...values: any[]) =>
  entries(...values)
    .sort(compare)
    .map(entry => entry.value);

describe('sortAsc', () => {
  it('sorts numbers inside text naturally', () => {
    expect(sorted(sortAsc, 'Lamp 10', 'Lamp 2', 'Lamp 1')).toEqual(['Lamp 1', 'Lamp 2', 'Lamp 10']);
  });

  it('sorts plain numbers by value', () => {
    expect(sorted(sortAsc, 100, 9, 25)).toEqual([9, 25, 100]);
  });

  it('puts a shorter prefix first', () => {
    expect(sorted(sortAsc, 'abc1', 'abc')).toEqual(['abc', 'abc1']);
  });
});

describe('sortDesc', () => {
  it('is the reverse order', () => {
    expect(sorted(sortDesc, 'Lamp 1', 'Lamp 10', 'Lamp 2')).toEqual(['Lamp 10', 'Lamp 2', 'Lamp 1']);
    expect(sorted(sortDesc, 9, 100, 25)).toEqual([100, 25, 9]);
  });
});
