import { KeyValue } from '@angular/common';

export function sortDesc(aKv: KeyValue<string, any>, bKv: KeyValue<string, any>) {
  const rx: RegExp = /(\d+)|(\D+)/g;
  const rd: RegExp = /\d+/;

  const as: string = aKv.value;
  const bs: string = bKv.value;

  const a: RegExpMatchArray = String(as).match(rx);
  const b: RegExpMatchArray = String(bs).match(rx);

  while (a.length && b.length) {
    const a1: string = a.shift();
    const b1: string = b.shift();
    if (rd.test(a1) || rd.test(b1)) {
      if (!rd.test(a1)) {
        return -1;
      }
      if (!rd.test(b1)) {
        return 1;
      }
      if (a1 !== b1) {
        return Number(b1) - Number(a1);
      }
    } else {
      if (a1 !== b1) {
        return b1.localeCompare(a1);
      }
    }
  }
  return b.length - a.length;
}

export function sortAsc(aKv: KeyValue<string, any>, bKv: KeyValue<string, any>) {
  const rx: RegExp = /(\d+)|(\D+)/g;
  const rd: RegExp = /\d+/;

  const as: string = aKv.value;
  const bs: string = bKv.value;

  const a: RegExpMatchArray = String(as).match(rx);
  const b: RegExpMatchArray = String(bs).match(rx);

  while (a.length && b.length) {
    const a1: string = a.shift();
    const b1: string = b.shift();
    if (rd.test(a1) || rd.test(b1)) {
      if (!rd.test(a1)) {
        return 1;
      }
      if (!rd.test(b1)) {
        return -1;
      }
      if (a1 !== b1) {
        return Number(a1) - Number(b1);
      }
    } else {
      if (a1 !== b1) {
        return a1.localeCompare(b1);
      }
    }
  }
  return a.length - b.length;
}
