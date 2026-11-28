import { describe, expect, it } from 'vitest';
import { fieldText, fieldValue, parsePluginParam, pythonToJson } from './plugin-param';

describe('parsePluginParam', () => {
  it.each([
    ['', {}],
    ['{}', {}],
    ["{'Disabled': 0, 'PowerOnAfterOffOn': 255}", { Disabled: 0, PowerOnAfterOffOn: 255 }],
    ["{'Disabled': 1}", { Disabled: 1 }],
    [
      "{'OnOffOnTimeDelay': {'01': 600, '02': 900}, 'Flag': True, 'X': None, 'F': False}",
      { OnOffOnTimeDelay: { '01': 600, '02': 900 }, Flag: true, X: null, F: false }
    ],
    ["{'Name': \"it's\", 'Path': 'a\\'b'}", { Name: "it's", Path: "a'b" }],
    ['{"Calibration": -1.5, "List": [1, 2,]}', { Calibration: -1.5, List: [1, 2] }],
    ["{'TrueName': 'True', 'k': 1,}", { TrueName: 'True', k: 1 }]
  ])('reads %j', (input, want) => {
    expect(parsePluginParam(input)).toEqual({ values: want });
  });

  it('reads JSON first, as the page saves it', () => {
    expect(parsePluginParam('{"Disabled": 0}')).toEqual({ values: { Disabled: 0 } });
  });

  it('treats null and undefined as no Param', () => {
    expect(parsePluginParam(null as unknown as string)).toEqual({ values: {} });
    expect(parsePluginParam(undefined as unknown as string)).toEqual({ values: {} });
  });

  it.each(["{'a': }", '[1, 2]', 'garbage'])('returns an error for %j', bad => {
    expect(parsePluginParam(bad)).toEqual({ error: bad });
  });
});

describe('pythonToJson', () => {
  it('unescapes \\n \\t \\r inside strings', () => {
    expect(JSON.parse(pythonToJson("{'a': 'x\\ny\\tz'}"))).toEqual({ a: 'x\ny\tz' });
  });

  it('leaves True / False / None inside strings alone', () => {
    expect(pythonToJson("{'k': 'None'}")).toBe('{"k": "None"}');
  });
});

describe('fieldValue', () => {
  it.each([
    ['600', 600],
    ['-2.5', -2.5],
    ['true', true],
    ['false', false],
    ['{"01": 600}', { '01': 600 }],
    ['[1, 2]', [1, 2]],
    ['abc', 'abc'],
    ['', '']
  ])('%j is %j', (text, want) => {
    expect(fieldValue(text)).toEqual(want);
  });

  it('throws on a malformed JSON field', () => {
    expect(() => fieldValue('{"01": }')).toThrow();
  });
});

describe('fieldText', () => {
  it.each([
    [{ '01': 600 }, '{"01":600}'],
    [[1, 2], '[1,2]'],
    [255, '255'],
    [true, 'true'],
    [null, ''],
    [undefined, '']
  ])('%j is %j', (value, want) => {
    expect(fieldText(value)).toBe(want);
  });
});
