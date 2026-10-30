/**
 * Device Param as the plugin sends it in /zdevice-name: str() of a Python dict, so single quotes,
 * True / False / None ("{'Disabled': 0, 'PowerOnAfterOffOn': 255}"), or "" when the device has none.
 * The page saves JSON, which the plugin reads first (WebServer.decode_device_param).
 */

export type ParamValues = { [key: string]: any };

export interface ParsedParam {
  values?: ParamValues;
  error?: string;
}

const PYTHON_WORDS: { [word: string]: string } = { True: 'true', False: 'false', None: 'null' };
const ESCAPES: { [char: string]: string } = { n: '\n', t: '\t', r: '\r' };

/** Python literal → JSON text: strings re-quoted, True/False/None, no trailing comma. */
export function pythonToJson(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (char === "'" || char === '"') {
      let value = '';
      let j = i + 1;
      while (j < text.length && text[j] !== char) {
        if (text[j] === '\\' && j + 1 < text.length) {
          value += ESCAPES[text[j + 1]] ?? text[j + 1];
          j += 2;
        } else {
          value += text[j++];
        }
      }
      out += JSON.stringify(value);
      i = j + 1;
    } else if (/[A-Za-z_]/.test(char)) {
      let j = i;
      while (j < text.length && /\w/.test(text[j])) {
        j++;
      }
      const word = text.slice(i, j);
      out += PYTHON_WORDS[word] ?? word;
      i = j;
    } else if (char === ',' && /^\s*[}\]]/.test(text.slice(i + 1))) {
      i++;
    } else {
      out += char;
      i++;
    }
  }
  return out;
}

/** JSON first (what this page saves), then the Python repr the plugin sends back. */
export function parsePluginParam(param: string): ParsedParam {
  const text = String(param ?? '').trim();
  if (text === '') {
    return { values: {} };
  }
  for (const candidate of [text, pythonToJson(text)]) {
    try {
      const value = JSON.parse(candidate);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return { values: value };
      }
    } catch {
      // try the next form
    }
  }
  return { error: text };
}

/** A field as typed: a number, true / false, a JSON object or list ({"01": 600}), else the text itself. */
export function fieldValue(text: string): any {
  const value = text.trim();
  if (value !== '' && !isNaN(Number(value))) {
    return Number(value);
  }
  if (value === 'true' || value === 'false') {
    return value === 'true';
  }
  if (value.startsWith('{') || value.startsWith('[')) {
    return JSON.parse(value);
  }
  return text;
}

export function fieldText(value: any): string {
  return value !== null && typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
}
