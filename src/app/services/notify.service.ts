import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PushNotificationsService } from 'ng-push';
import { Logger } from '@app/core';

const log = new Logger('NotifyService');

@Injectable({ providedIn: 'root' })
export class NotifyService {
  constructor(private pushNotifications: PushNotificationsService, private translate: TranslateService) {}

  notify(notification?: string) {
    const options = {
      body: notification === null ? this.translate.instant('update.success') : notification
    };
    this.pushNotifications.create(this.translate.instant('APP_NAME'), options).subscribe((res: any) => log.debug(res));
  }
}
