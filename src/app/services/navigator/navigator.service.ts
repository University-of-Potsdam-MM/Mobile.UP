import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { WebIntentService } from '../web-intent/web-intent.service';
import { Logger, LoggingService } from 'ionic-logging-service';

import { Plugins } from '@capacitor/core';
const { StartNavigationPlugin } = Plugins;

@Injectable({
  providedIn: 'root',
})
export class NavigatorService {
  logger: Logger;

  constructor(
    private translate: TranslateService,
    private webIntent: WebIntentService,
    private loggingService: LoggingService
  ) {
    this.logger = this.loggingService.getLogger('[/navigator-service]');
  }

  public navigateToLatLong(latLong: number[]) {
    if (latLong && latLong.length > 1) {
      // launches native maps with directions to Warwick, UK
      StartNavigationPlugin.launchMapsApp(
        {
          latitude: latLong[0],
          longitude: latLong[1],
          name: this.translate.instant('launchNavigator.destination'),
        },
        (error) => {
          this.logger.error('navigateToLatLong', error);
          this.webIntent.permissionPromptWebsite(
            'https://maps.google.com/?q=' +
              String(latLong[0]) +
              ',' +
              String(latLong[1])
          );
        }
      );
    }
  }
}
