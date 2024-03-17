import { Component, Input } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'shared-custom-icon',
  templateUrl: './custom-icon.component.html'
})
export class CustomIconComponent {
  @Input() iconName!: string;
}
