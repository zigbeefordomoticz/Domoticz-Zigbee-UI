import { describe, expect, it } from 'vitest';
import { redact } from './support-bundle';

describe('redact', () => {
  it('removes the plugin parameters that hold credentials', () => {
    const plugin = {
      Version: '9.1.008',
      Username: 'admin',
      Password: 'secret',
      Mode5: 'http://admin:secret@127.0.0.1:8080',
      Mode2: 'ZNP'
    };
    expect(redact(plugin)).toEqual({
      Version: '9.1.008',
      Username: '[removed]',
      Password: '[removed]',
      Mode5: '[removed]',
      Mode2: 'ZNP'
    });
    // The input is not changed
    expect(plugin.Password).toBe('secret');
  });

  it('removes the Domoticz login and the network key, whatever the case', () => {
    expect(redact({ WebUserName: 'u', WebPassword: 'p' })).toEqual({
      WebUserName: '[removed]',
      WebPassword: '[removed]'
    });
    expect(redact({ IEEE: '00124b', 'Network Key': 'abcd' })).toEqual({ IEEE: '00124b', 'Network Key': '[removed]' });
    expect(redact({ gp: [{ SECURITY_KEY: 'k' }] })).toEqual({ gp: [{ SECURITY_KEY: '[removed]' }] });
  });

  it('removes credentials from URLs anywhere in a string', () => {
    expect(redact({ a: [{ url: 'https://me:pw@host/x and http://host/y' }] })).toEqual({
      a: [{ url: 'https://[removed]@host/x and http://host/y' }]
    });
  });

  it('leaves everything else as it is', () => {
    expect(redact([1, null, true, 'text', { Key: 'Zigate' }])).toEqual([1, null, true, 'text', { Key: 'Zigate' }]);
    expect(redact(undefined)).toBeUndefined();
  });
});
