import { Component, Input } from '@angular/core';

@Component({
  selector: 'shared-custom-icon',
  templateUrl: './custom-icon.component.html'
})
export class CustomIconComponent {
  @Input() iconName!: string;
}
