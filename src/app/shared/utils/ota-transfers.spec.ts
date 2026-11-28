import { describe, expect, it } from 'vitest';
import { runningTransfers } from './ota-transfers';

describe('runningTransfers', () => {
  it('pairs each device with its progress', () => {
    expect(runningTransfers({ OTAupdateDevice: 'a1b2, c3d4', OTAupdateProgress: '12%, 80%' })).toEqual([
      { nwkid: 'a1b2', progress: '12%' },
      { nwkid: 'c3d4', progress: '80%' }
    ]);
  });

  it('leaves out the transfers that ended', () => {
    expect(runningTransfers({ OTAupdateDevice: 'a1b2,c3d4', OTAupdateProgress: 'Success,45%' })).toEqual([
      { nwkid: 'c3d4', progress: '45%' }
    ]);
  });

  it('is empty with nothing running', () => {
    expect(runningTransfers({})).toEqual([]);
    expect(runningTransfers(null)).toEqual([]);
    expect(runningTransfers({ OTAupdateDevice: '', OTAupdateProgress: '' })).toEqual([]);
  });
});
