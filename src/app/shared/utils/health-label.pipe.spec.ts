import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SharedModule } from '../shared.module';
import { HealthLabelPipe, healthTone } from './health-label.pipe';

describe('HealthLabelPipe', () => {
  const pipe = new HealthLabelPipe();

  it('maps a plugin Health value to its translation key', () => {
    expect(pipe.transform('Live')).toBe('device.health.live');
    expect(pipe.transform('Not seen last 24hours')).toBe('device.health.notseen');
    expect(pipe.transform('')).toBe('device.health.unknown');
  });

  it('returns an unknown value unchanged', () => {
    expect(pipe.transform('Something new')).toBe('Something new');
  });

  it('renders in a template through SharedModule', () => {
    @Component({
      template: '<span>{{ health | healthLabel }}</span>',
      imports: [SharedModule]
    })
    class HostComponent {
      health = 'TimedOut';
    }

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('device.health.timedout');
  });
});

describe('healthTone', () => {
  it.each([
    ['Live', 'success'],
    ['TimedOut', 'warning'],
    ['Not Reachable', 'danger'],
    ['Disabled', 'secondary'],
    ['whatever', 'secondary']
  ])('%s is %s', (health, tone) => {
    expect(healthTone(health)).toBe(tone);
  });
});
