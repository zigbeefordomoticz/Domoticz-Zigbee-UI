import { describe, expect, it } from 'vitest';
import { familyIcon, MESH_FAMILY_ICONS, MeshDeviceFamily, resolveDeviceType } from './mesh-device-type';

describe('resolveDeviceType', () => {
  it('is undefined for a device that reported nothing', () => {
    expect(resolveDeviceType(undefined)).toBeUndefined();
    expect(resolveDeviceType({ nwkid: 'a1b2', zdeviceId: {}, profileId: '', endpoints: {} })).toBeUndefined();
  });

  it('names a ZHA id', () => {
    expect(resolveDeviceType({ nwkid: 'a1b2', zdeviceId: '0051', profileId: '0104' })).toEqual({
      id: '0051',
      profileId: '0104',
      profile: 'zha',
      family: 'plug',
      label: 'Smart Plug'
    });
  });

  it('reads the table of the profile first: 0200 is a shade in ZHA, a colour light in ZLL', () => {
    expect(resolveDeviceType({ nwkid: 'x', zdeviceId: '0200', profileId: '0104' })).toMatchObject({ label: 'Shade' });
    expect(resolveDeviceType({ nwkid: 'x', zdeviceId: '0200', profileId: 'c05e' })).toMatchObject({
      profile: 'zll',
      label: 'Colour Light'
    });
  });

  it('falls back to the other table (ZLL controller under ZHA, as IKEA remotes)', () => {
    expect(resolveDeviceType({ nwkid: 'x', zdeviceId: '0820', profileId: '0104' })).toMatchObject({
      profile: 'zll',
      label: 'Non-Colour Controller'
    });
  });

  it('skips the Green Power proxy the global fields often hold', () => {
    const type = resolveDeviceType({
      nwkid: 'x',
      zdeviceId: '0061',
      profileId: 'a1e0',
      endpoints: { '0b': { ProfileID: 'c05e', ZDeviceID: '0210' }, f2: { ProfileID: 'a1e0', ZDeviceID: '0061' } }
    });
    expect(type).toMatchObject({ id: '0210', endpoint: '0b', label: 'Extended Colour Light' });
  });

  it('prefers an id reported under a ZHA / ZLL profile over a vendor profile (Develco plugs)', () => {
    const type = resolveDeviceType({
      nwkid: 'x',
      zdeviceId: '0051',
      profileId: 'c0c9',
      endpoints: { '01': { ProfileID: 'c0c9', ZDeviceID: '0051' }, '02': { ProfileID: '0104', ZDeviceID: '0051' } }
    });
    expect(type).toMatchObject({ id: '0051', profileId: '0104', endpoint: '02', label: 'Smart Plug' });
  });

  it('returns an unknown id as reported, with no name', () => {
    expect(resolveDeviceType({ nwkid: 'x', zdeviceId: '0x00FE', profileId: '0104' })).toEqual({
      id: '00fe',
      profileId: '0104'
    });
  });

  it('rejects malformed hex fields', () => {
    expect(resolveDeviceType({ nwkid: 'x', zdeviceId: '12345', profileId: '0104' })).toBeUndefined();
    expect(resolveDeviceType({ nwkid: 'x', zdeviceId: 'zz', profileId: '0104' })).toBeUndefined();
    expect(resolveDeviceType({ nwkid: 'x', zdeviceId: 81, profileId: '0104' })).toBeUndefined();
  });

  it('uses the configured ZDeviceID and keeps the reported one when it differs', () => {
    // CPR412-E: configuration declares 0202 only; the reported profile 0104 makes it a window covering
    const type = resolveDeviceType({
      nwkid: 'x',
      zdeviceId: '0051',
      profileId: '0104',
      configured: { ZDeviceID: '0202' }
    });
    expect(type).toMatchObject({
      id: '0202',
      profileId: '0104',
      label: 'Window Covering Device',
      configured: true,
      reportedId: '0051'
    });
  });

  it('gives no reportedId when the configuration agrees, and works with nothing reported', () => {
    expect(
      resolveDeviceType({ nwkid: 'x', zdeviceId: '0202', profileId: '0104', configured: { ZDeviceID: '0202' } })
    ).not.toHaveProperty('reportedId');
    expect(resolveDeviceType({ nwkid: 'x', configured: { ZDeviceID: '0100', ProfileID: 'c05e' } })).toMatchObject({
      id: '0100',
      profile: 'zll',
      label: 'Dimmable Light',
      configured: true
    });
  });

  it('ignores an empty configuration', () => {
    expect(resolveDeviceType({ nwkid: 'x', zdeviceId: '0051', profileId: '0104', configured: {} })).not.toHaveProperty(
      'configured'
    );
  });
});

describe('familyIcon', () => {
  it('has a glyph for every family', () => {
    for (const family of Object.keys(MESH_FAMILY_ICONS) as MeshDeviceFamily[]) {
      expect(familyIcon(family), family).not.toBe('');
    }
  });
});
