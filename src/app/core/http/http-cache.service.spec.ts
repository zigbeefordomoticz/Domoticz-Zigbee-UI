import { HttpResponse } from '@angular/common/http';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Logger, LogLevel } from '../logger.service';
import { HttpCacheService } from './http-cache.service';

const url = '/rest-z4d/1/plugin';
const response = new HttpResponse({ body: { PluginVersion: '9.1.010' }, status: 200 });

describe('HttpCacheService', () => {
  const level = Logger.level;
  beforeAll(() => (Logger.level = LogLevel.Off));
  afterAll(() => (Logger.level = level));
  beforeEach(() => localStorage.clear());

  it('has nothing for an unknown URL', () => {
    const cache = new HttpCacheService();
    expect(cache.getCacheData(url)).toBeNull();
    expect(cache.getHttpCacheEntry(url)).toBeNull();
  });

  it('returns what was stored, with its date', () => {
    const cache = new HttpCacheService();
    const when = new Date(2026, 10, 28);
    cache.setCacheData(url, response, when);
    expect(cache.getCacheData(url)).toBe(response);
    expect(cache.getHttpCacheEntry(url)).toEqual({ lastUpdated: when, data: response });
  });

  it('clears one URL', () => {
    const cache = new HttpCacheService();
    cache.setCacheData(url, response);
    cache.setCacheData('/rest-z4d/1/device', response);
    cache.clearCache(url);
    expect(cache.getCacheData(url)).toBeNull();
    expect(cache.getCacheData('/rest-z4d/1/device')).toBe(response);
  });

  it('cleans the entries up to a date, or all of them', () => {
    const cache = new HttpCacheService();
    cache.setCacheData('/old', response, new Date(2026, 0, 1));
    cache.setCacheData('/edge', response, new Date(2026, 5, 1));
    cache.setCacheData('/new', response, new Date(2026, 11, 1));

    cache.cleanCache(new Date(2026, 5, 1));
    expect(cache.getCacheData('/old')).toBeNull();
    expect(cache.getCacheData('/edge')).toBeNull();
    expect(cache.getCacheData('/new')).toBe(response);

    cache.cleanCache();
    expect(cache.getCacheData('/new')).toBeNull();
  });

  it('keeps the cache in memory only by default', () => {
    new HttpCacheService().setCacheData(url, response);
    expect(localStorage.getItem('httpCache')).toBeNull();
  });

  it('with local persistence, a new instance reads what an earlier one stored', () => {
    const first = new HttpCacheService();
    first.setPersistence('local');
    first.setCacheData(url, response);

    const second = new HttpCacheService();
    second.setPersistence('local');
    expect(second.getCacheData(url)).toMatchObject({ status: 200, body: { PluginVersion: '9.1.010' } });
  });

  it('switching persistence clears the cache', () => {
    const cache = new HttpCacheService();
    cache.setCacheData(url, response);
    cache.setPersistence('session');
    expect(cache.getCacheData(url)).toBeNull();
  });
});
