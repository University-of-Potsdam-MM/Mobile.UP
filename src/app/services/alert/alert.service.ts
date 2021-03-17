import { Injectable } from '@angular/core';
import {
  AlertController,
  NavController,
  ToastController,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AlertButton, ToastButton } from '@ionic/core';
import { Logger, LoggingService } from 'ionic-logging-service';

/**
 * @type {IAlertOptions}
 */
export interface IAlertOptions {
  headerI18nKey?: string;
  messageI18nKey?: string;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  currentAlert = null;
  currentToast = null;
  logger: Logger;

  /**
   * @constructor
   * @param {AlertController} alertCtrl
   * @param {TranslateService} translate
   * @param {NavController} navCtrl
   */
  constructor(
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private loggingService: LoggingService
  ) {
    this.logger = this.loggingService.getLogger('[/alert-service]');
  }

  /**
   * @name showAlert
   * @description shows alert as specified by alertOptions parameter
   * @param {IAlertOptions} alertOptions
   */
  async showAlert(alertOptions: IAlertOptions, buttons?: AlertButton[]) {
    let alertButtons: AlertButton[] = [];
    if (buttons) {
      alertButtons = buttons;
    } else {
      alertButtons = [
        {
          text: this.translate.instant('button.toHome'),
          handler: () => {
            this.navCtrl.navigateRoot('/home');
            this.currentAlert = null;
          },
        },
        {
          text: this.translate.instant('button.continue'),
          handler: () => {
            this.currentAlert = null;
          },
        },
      ];
    }

    let headerText = '';
    let messageText = '';
    if (alertOptions.headerI18nKey) {
      headerText = this.translate.instant(alertOptions.headerI18nKey);
    }

    if (alertOptions.messageI18nKey) {
      messageText = this.translate.instant(alertOptions.messageI18nKey);
    }

    if (alertOptions.errorMessage) {
      if (messageText === '') {
        messageText = alertOptions.errorMessage;
      } else {
        messageText += ' ERROR: ' + alertOptions.errorMessage;
      }
    }

    // only show new alert if no other alert is currently open
    if (!this.currentAlert) {
      this.currentAlert = await this.alertCtrl.create({
        header: headerText,
        message: messageText,
        backdropDismiss: false,
        buttons: alertButtons,
      });
      this.currentAlert.present();
      await this.currentAlert.onDidDismiss();
      this.currentAlert = undefined;
    } else {
      this.logger.debug('showAlert', 'another alert is shown');
    }
  }

  /**
   * @name presentToast
   * @param message
   */
  async showToast(messageI18nKey, error?) {
    const messageText = this.translate.instant(messageI18nKey);
    let toastButtons: ToastButton[];

    if (error) {
      const alertButtons: AlertButton[] = [
        {
          text: this.translate.instant('button.continue'),
          handler: () => {
            this.currentAlert = null;
          },
        },
      ];

      toastButtons = [
        {
          side: 'end',
          // role: 'cancel',
          icon: 'information-circle',
          handler: () => {
            this.showAlert(
              {
                headerI18nKey: 'alert.title.httpError',
                errorMessage: String(error.message),
              },
              alertButtons
            );
          },
        },
      ];
    }

    if (!this.currentToast) {
      this.currentToast = await this.toastCtrl.create({
        message: messageText,
        duration: 2000,
        position: 'top',
        cssClass: 'updateToast',
        buttons: toastButtons,
      });
      this.currentToast.present();
      await this.currentToast.onDidDismiss();
      this.currentToast = undefined;
    } else {
      this.logger.debug('showToast', 'another toast is shown');
    }
  }
}
