export interface OtaTransfer {
  nwkid: string;
  progress: string;
}

/**
 * The firmware transfers running now, from /plugin-health.
 * One "<nwkid>" / "<progress>" pair per transfer, comma separated when several run at once.
 * Progress is "<n>%" while blocks flow; "Success", "Aborted", "Failed"... stay after the end.
 */
export function runningTransfers(pluginHealth: any): OtaTransfer[] {
  const devices = String(pluginHealth?.OTAupdateDevice ?? '').split(',');
  return String(pluginHealth?.OTAupdateProgress ?? '')
    .split(',')
    .map((progress, index) => ({ progress: progress.trim(), nwkid: (devices[index] ?? '').trim() }))
    .filter(transfer => transfer.progress.endsWith('%'));
}
