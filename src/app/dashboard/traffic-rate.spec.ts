import { describe, expect, it } from 'vitest';
import { Trend } from '@app/shared/models/plugin-stats';
import { hasIntervalCounts, messagesPerMinute } from './traffic-rate';

/** n trend points every dt seconds; the first one's counts (999) go back before the window. */
const points = (n: number, rx: number, tx: number, dt = 5): Trend[] =>
  Array.from(
    { length: n },
    (_, i) =>
      ({
        _TS: i,
        Rxps: 0,
        Txps: 0,
        Load: i % 3,
        Time: 1000 + i * dt,
        RxCount: i === 0 ? 999 : rx,
        TxCount: i === 0 ? 999 : tx
      }) as Trend
  );

describe('messagesPerMinute', () => {
  it('gives a constant rate, ignoring the first point counts', () => {
    // 3 received / 1 sent every 5 s = 36 / 12 per minute
    const rates = messagesPerMinute(points(120, 3, 1));
    expect(rates).toHaveLength(119);
    expect(rates.every(p => p.rx === 36 && p.tx === 12)).toBe(true);
    expect(rates[0].time).toBe(1005000);
  });

  it('counts a burst for one minute', () => {
    const trend = points(40, 0, 0);
    trend[20].RxCount = 60;
    const rates = messagesPerMinute(trend);
    expect([rates[19].rx, rates[30].rx, rates[31].rx]).toEqual([60, 60, 0]);
  });

  it('shows no spike for two points in one heartbeat', () => {
    const trend = points(30, 3, 1);
    trend.splice(15, 0, { ...trend[14], RxCount: 0, TxCount: 0 });
    expect(Math.max(...messagesPerMinute(trend).map(p => p.rx))).toBe(36);
  });

  it('sorts its input by Time', () => {
    expect(messagesPerMinute(points(20, 3, 1).reverse()).every(p => p.rx === 36)).toBe(true);
  });

  it('gives no rate for zero or one point', () => {
    expect(messagesPerMinute([])).toEqual([]);
    expect(messagesPerMinute(points(1, 1, 1))).toEqual([]);
  });
});

describe('hasIntervalCounts', () => {
  const old = (n: number) => Array.from({ length: n }, (_, i) => ({ _TS: i, Rxps: 1, Txps: 1, Load: 0 }) as Trend);

  it('detects an older plugin (no counts)', () => {
    expect(hasIntervalCounts(old(2))).toBe(false);
    expect(hasIntervalCounts(old(1))).toBe(false);
  });

  it('detects a plugin with counts', () => {
    expect(hasIntervalCounts(points(3, 1, 1))).toBe(true);
  });

  it('does not take start-up (no point or one point) for an older plugin', () => {
    expect(hasIntervalCounts([])).toBe(true);
    expect(hasIntervalCounts(points(1, 1, 1))).toBe(true);
  });
});
