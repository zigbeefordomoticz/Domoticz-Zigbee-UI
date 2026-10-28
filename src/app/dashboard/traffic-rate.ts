import { Trend } from '@app/shared/models/plugin-stats';

// Messages per minute are counted over this rolling window (seconds)
export const RATE_WINDOW_SECONDS = 60;

export interface RatePoint {
  time: number; // epoch, milliseconds
  rx: number; // messages received per minute
  tx: number; // messages sent per minute
  load: number;
}

/**
 * True when the plugin sends per-interval counts: RxCount / TxCount (messages since the previous
 * point) and Time (epoch) on each trend point. Older plugins send only Rxps / Txps, averages
 * since the plugin started, from which no rate can be derived.
 */
export function hasIntervalCounts(trend: Trend[]): boolean {
  return (
    trend.length > 1 &&
    trend.every(
      point => typeof point.Time === 'number' && typeof point.RxCount === 'number' && typeof point.TxCount === 'number'
    )
  );
}

/**
 * Messages per minute at each point, over the last RATE_WINDOW_SECONDS.
 *
 * A point's counts cover the interval since the previous point, so the first point only gives a
 * time reference: its counts go back to a point that is no longer kept, or to the plugin start.
 * Two points added in the same heartbeat simply share the window.
 */
export function messagesPerMinute(trend: Trend[]): RatePoint[] {
  const points = [...trend].sort((a, b) => a.Time - b.Time);
  const rates: RatePoint[] = [];
  let first = 1; // first point whose counts are inside the window
  let rx = 0;
  let tx = 0;
  for (let i = 1; i < points.length; i++) {
    rx += points[i].RxCount;
    tx += points[i].TxCount;
    while (first < i && points[i].Time - points[first].Time >= RATE_WINDOW_SECONDS) {
      rx -= points[first].RxCount;
      tx -= points[first].TxCount;
      first++;
    }
    const span = points[i].Time - points[first - 1].Time;
    if (span > 0) {
      rates.push({
        time: points[i].Time * 1000,
        rx: Math.round(((rx * 60) / span) * 10) / 10,
        tx: Math.round(((tx * 60) / span) * 10) / 10,
        load: points[i].Load
      });
    }
  }
  return rates;
}
