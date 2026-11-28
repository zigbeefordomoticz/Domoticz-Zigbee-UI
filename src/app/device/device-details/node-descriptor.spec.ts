import { describe, expect, it } from 'vitest';
import { decodeNodeDescriptor, rollingLqi, rollingRssi } from './node-descriptor';

describe('decodeNodeDescriptor', () => {
  it('decodes a router (Philips-like)', () => {
    // manuf 100b, rx 0080, tx 0080, server 2c00 (R22), desc cap 00, mac 8e, buffer 52, 2.4 GHz, router
    const d = decodeNodeDescriptor('100b008000802c00008e524001')!;
    expect(d.logicalType).toBe('router');
    expect(d.frequencyBands).toEqual(['2.4 GHz']);
    expect(d.manufacturerCode).toBe('100b');
    expect(d.fullFunctionDevice).toBe(true);
    expect(d.mainsPowered).toBe(true);
    expect(d.receiverOnWhenIdle).toBe(true);
    expect(d.securityCapable).toBe(false);
    expect(d.allocateAddress).toBe(true);
    expect(d.alternatePanCoordinator).toBe(false);
    expect([d.maxBufferSize, d.maxIncomingTransferSize, d.maxOutgoingTransferSize]).toEqual([82, 128, 128]);
    expect(d.stackComplianceRevision).toBe(22);
    expect(d.serverRoles).toEqual([]);
  });

  it('decodes a sleepy end device (Xiaomi-like)', () => {
    // manuf 115f, rx 0064, tx 0064, server 0000, mac 80, buffer 7f, end device, 2.4 GHz
    const d = decodeNodeDescriptor('115f00640064000000807f4002')!;
    expect(d.logicalType).toBe('enddevice');
    expect(d.fullFunctionDevice).toBe(false);
    expect(d.mainsPowered).toBe(false);
    expect(d.receiverOnWhenIdle).toBe(false);
    expect(d.allocateAddress).toBe(true);
    expect(d.stackComplianceRevision).toBe(0);
  });

  it('decodes a coordinator with server roles and descriptor flags', () => {
    // server 2a41 = bits 0 (primary TC) and 6 (network manager), stack 21; desc cap 03; complex + user flags
    const d = decodeNodeDescriptor('0000005200522a41038f504018')!;
    expect(d.logicalType).toBe('coordinator');
    expect(d.serverRoles).toEqual(['primarytc', 'networkmanager']);
    expect(d.stackComplianceRevision).toBe(21);
    expect(d.extendedActiveEndpointList).toBe(true);
    expect(d.extendedSimpleDescriptorList).toBe(true);
    expect(d.complexDescriptor).toBe(true);
    expect(d.userDescriptor).toBe(true);
  });

  it.each([undefined, null, '', {}, '12', 'zz0b008000802c00008e524001'])('returns null for %j', bad => {
    expect(decodeNodeDescriptor(bad)).toBeNull();
  });
});

describe('rollingLqi', () => {
  it('keeps the valid LQI values (0-255)', () => {
    expect(rollingLqi([10, '20', 300, -1, 'x', 255])).toEqual([10, 20, 255]);
  });

  it('keeps the last 10', () => {
    expect(rollingLqi(Array.from({ length: 12 }, (_, i) => i))).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('returns [] when not a list', () => {
    expect(rollingLqi({})).toEqual([]);
  });
});

describe('rollingRssi', () => {
  it('keeps the valid RSSI values (-128..0)', () => {
    expect(rollingRssi([-40, '-38', 5, -200, 'x', -128, 0])).toEqual([-40, -38, -128, 0]);
  });

  it('keeps the last 10', () => {
    expect(rollingRssi(Array.from({ length: 12 }, (_, i) => -i))).toEqual([-2, -3, -4, -5, -6, -7, -8, -9, -10, -11]);
  });

  it('returns [] when not a list', () => {
    expect(rollingRssi(undefined)).toEqual([]);
  });
});
