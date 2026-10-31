// Keys whose value is never written to a support bundle. /plugin answers the plugin parameters
// unfiltered (Mode5 is the Domoticz API URL, Username / Password its credentials), /domoticz-env the
// Domoticz login, /coordinator the network key.
const SECRET_KEYS = new Set(['password', 'username', 'mode5', 'webusername', 'webpassword', 'network key']);
const REDACTED = '[removed]';

/**
 * A copy of a REST answer that can be attached to a public issue: secrets removed by key, and
 * credentials removed from any URL ("http://user:pass@host" → "http://[removed]@host").
 */
export function redact(value: any): any {
  if (Array.isArray(value)) {
    return value.map(item => redact(item));
  }
  if (value && typeof value === 'object') {
    const copy: Record<string, any> = {};
    Object.keys(value).forEach(key => {
      copy[key] = SECRET_KEYS.has(key.toLowerCase()) ? REDACTED : redact(value[key]);
    });
    return copy;
  }
  if (typeof value === 'string') {
    return value.replace(/(\w+:\/\/)[^/@\s]+@/g, `$1${REDACTED}@`);
  }
  return value;
}
