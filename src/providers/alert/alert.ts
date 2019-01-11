import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AlertController } from "ionic-angular";
import { TranslateService } from "@ngx-translate/core";

/**
 * @type {EErrorType}
 */
export enum EErrorType {
  HTTP, OTHER
}

/**
 * @type {EErrorReason}
 */
export enum EErrorReason {
  AUTHENTICATION, NETWORK
}

/**
 * @type {EAlertType}
 */
export enum EAlertType {
  ERROR
}

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

  constructor(public http: HttpClient,
              private alertCtrl: AlertController,
              private translate: TranslateService) {
  }

  /**
   * @name showAlert
   * @description shows alert as specified by alertOptions parameter
   * @param {IAlertOptions} alertOptions
   */
  showAlert(alertOptions:IAlertOptions){

    let alert = this.alertCtrl.create({
      title: this.translate.instant(alertOptions.alertTitleI18nKey),
      message: this.translate.instant(alertOptions.messageI18nKey),
      buttons: [ this.translate.instant("button.continue") ]
    });

    alert.present();
  }

}