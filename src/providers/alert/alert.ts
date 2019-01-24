import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Alert, AlertController, NavController} from "ionic-angular";
import { TranslateService } from "@ngx-translate/core";
import {HomePage} from "../../pages/home/home";

/**
 * @type {IAlertOptions}
 */
export interface IAlertOptions {
  alertTitleI18nKey:string;
  messageI18nKey:string;
}

/**
 * @class AlertProvider
 * @classdesc Provider for alert messages
 */
@Injectable()
export class AlertProvider {

  currentAlert:Alert = null;

  /**
   * @constructor
   * @param {HttpClient} http
   * @param {AlertController} alertCtrl
   * @param {TranslateService} translate
   */
  constructor(public http: HttpClient,
              private alertCtrl: AlertController,
              private translate: TranslateService,
              private navCtrl: NavController) {
  }

  /**
   * @name showAlert
   * @description shows alert as specified by alertOptions parameter
   * @param {IAlertOptions} alertOptions
   */
  showAlert(alertOptions:IAlertOptions){
    // only show new alert if no other alert is currently open
    if(!this.currentAlert){

      this.currentAlert = this.alertCtrl.create({
        title: this.translate.instant(alertOptions.alertTitleI18nKey),
        message: this.translate.instant(alertOptions.messageI18nKey),
        buttons: [
          {
            text: this.translate.instant("button.toHome"),
           // handler: () => { this.navCtrl.push(HomePage) }
          },
          {
            text: this.translate.instant("button.toHome")
          }
        ]
      });

      this.currentAlert.onDidDismiss(()=>this.currentAlert=null);
      this.currentAlert.present();
    }
  }

}
