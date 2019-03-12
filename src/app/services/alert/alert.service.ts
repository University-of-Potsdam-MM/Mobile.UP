import { Injectable } from '@angular/core';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

/**
 * @type {IAlertOptions}
 */
export interface IAlertOptions {
  alertTitleI18nKey: string;
  messageI18nKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  currentAlert = null;

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
    private toastCtrl: ToastController
    ) { }

  /**
   * @name showAlert
   * @description shows alert as specified by alertOptions parameter
   * @param {IAlertOptions} alertOptions
   */
    async showAlert(alertOptions: IAlertOptions) {
      // only show new alert if no other alert is currently open
      if (!this.currentAlert) {
        this.currentAlert = await this.alertCtrl.create({
          header: this.translate.instant(alertOptions.alertTitleI18nKey),
          message: this.translate.instant(alertOptions.messageI18nKey),
          backdropDismiss: false,
          buttons: [
            {
              text: this.translate.instant('button.toHome'),
              handler: () => {
                this.navCtrl.navigateRoot('/home');
                this.currentAlert = null;
              }
            },
            {
              text: this.translate.instant('button.continue'),
              handler: () => {
                this.currentAlert = null;
              }
            }
          ]
        });

      this.currentAlert.present();
    }
  }

  /**
   * @name presentToast
   * @param message
   */
  async presentToast(message) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'top',
      cssClass: 'toastPosition'
    });
    toast.present();
  }
}
