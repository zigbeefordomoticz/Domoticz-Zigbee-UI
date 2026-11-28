import { describe, expect, it } from 'vitest';
import { nl2brPipe } from './nl2br.pipe';

describe('nl2brPipe', () => {
  const pipe = new nl2brPipe();

  it('turns every newline into <br/>', () => {
    expect(pipe.transform('a\nb\nc')).toBe('a<br/>b<br/>c');
  });

  it('returns null for an empty value', () => {
    expect(pipe.transform('')).toBeNull();
    expect(pipe.transform(undefined as unknown as string)).toBeNull();
  });
});
