import { describe, expect, it } from 'vitest';
import { coordinatorTone, devicesTone } from './status-tone';

describe('coordinatorTone', () => {
  it.each([
    [1, 'success'],
    [2, 'warning'],
    [3, 'danger'],
    [0, 'danger'],
    [4, 'info'],
    [99, 'secondary']
  ])('HealthFlag %s is %s', (flag, tone) => {
    expect(coordinatorTone({ HealthFlag: flag })).toBe(tone);
  });

  it('is secondary with no health', () => {
    expect(coordinatorTone(null)).toBe('secondary');
    expect(coordinatorTone({})).toBe('secondary');
  });
});

describe('devicesTone', () => {
  it('is secondary with no counts', () => {
    expect(devicesTone(null)).toBe('secondary');
  });
});
