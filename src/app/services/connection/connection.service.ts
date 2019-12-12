import { Injectable } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AlertService } from '../alert/alert.service';
import { Logger, LoggingService } from 'ionic-logging-service';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {

  logger: Logger;

  constructor(
    private translate: TranslateService,
    private navCtrl: NavController,
    private alertService: AlertService,
    private loggingService: LoggingService
  ) {
    this.logger = this.loggingService.getLogger('[/connection-service]');
  }

  /**
   * returns connection state. Set showAlert and/or sendHome to true to show an alert
   * about the connection state or/and send the user to HomePage
   * @return boolean
   */
  checkOnline(showAlert: boolean = false, sendHome: boolean = false): boolean {
    if (!navigator.onLine) {
      if (showAlert && sendHome) {
        this.alertService.showAlert(
          {
            messageI18nKey: 'alert.noInternetConnection'
          },
          [
            {
              text: this.translate.instant('button.continue'),
              handler: () => {
                this.navCtrl.navigateRoot('/home');
              }
            }
          ]
        );
      }

      if (!showAlert && sendHome) {
        this.navCtrl.navigateRoot('/home');
      }
    }

    this.logger.debug('checkOnline', `is app connected? -> ${navigator.onLine}`);
    return navigator.onLine;
  }

}
