import { Injectable } from '@angular/core';
import { ActionSheetController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { contains } from 'src/app/lib/util';
import { DeviceService } from '../device/device.service';
import { WebIntentService } from '../web-intent/web-intent.service';
// import { Logger, LoggingService } from 'ionic-logging-service';

@Injectable({
  providedIn: 'root',
})
export class NavigatorService {
  // logger: Logger;

  constructor(
    private translate: TranslateService,
    private actionSheetCtrl: ActionSheetController,
    private platform: Platform,
    private device: DeviceService,
    private webIntent: WebIntentService // private loggingService: LoggingService
  ) {
    // this.logger = this.loggingService.getLogger('[/navigator-service]');
  }

  public navigateToLatLong(latLong: number[]) {
    if (latLong && latLong.length > 1) {
      const latLongQuery = String(latLong[0]) + ',' + String(latLong[1]);

      const googleEndpoint =
        'https://www.google.com/maps/search/?api=1&query=' + latLongQuery;
      const appleEndpoint = 'http://maps.apple.com/?sll=' + latLongQuery;

      this.handleMapIntent(googleEndpoint, appleEndpoint);
    }
  }

  navigateToAddress(locationAddress: string) {
    const escapedQuery = encodeURI(locationAddress);

    const googleEndpoint =
      'https://www.google.com/maps/search/?api=1&query=' + escapedQuery;
    const appleEndpoint = 'http://maps.apple.com/?q=' + escapedQuery;

    this.handleMapIntent(googleEndpoint, appleEndpoint);
  }

  private async handleMapIntent(googleURL: string, appleURL: string) {
    if (this.platform.is('ios') || this.isAppleDesktop()) {
      const actionSheet = await this.actionSheetCtrl.create({
        header: this.translate.instant('launchNavigator.dialogHeaderText'),
        buttons: [
          {
            text: 'Apple Maps',
            handler: () => {
              this.webIntent.permissionPromptWebsite(appleURL);
            },
          },
          {
            text: 'Google Maps',
            handler: () => {
              this.webIntent.permissionPromptWebsite(googleURL);
            },
          },
          {
            text: this.translate.instant('button.cancel'),
            role: 'cancel',
          },
        ],
      });
      await actionSheet.present();
    } else {
      this.webIntent.permissionPromptWebsite(googleURL);
    }
  }

  private async isAppleDesktop(): Promise<boolean> {
    const deviceInfo = await this.device.getDeviceInfo();

    if (
      contains(deviceInfo.deviceManufacturer, 'Apple') ||
      contains(deviceInfo.deviceModel, 'Macintosh') ||
      contains(deviceInfo.osPlatform, 'Mac')
    ) {
      return true;
    } else {
      return false;
    }
  }
}
