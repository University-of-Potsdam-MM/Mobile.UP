import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {AlertController} from "ionic-angular";
import {ConfigProvider} from "../config/config";
import {TranslateService} from "@ngx-translate/core";

export enum EErrorType {
  HTTP, OTHER
}

export enum EErrorReason {
  AUTHENTICATION, NETWORK
}

export enum EAlertType {
  ERROR
}

export interface IAlertOptions {
  alertTitleI18nKey:string;
  messageI18nKey:string;
}

@Injectable()
export class AlertProvider {

  constructor(public http: HttpClient,
              private alertCtrl: AlertController,
              private translate: TranslateService) {
  }

  /**
   * @name showAlert
   * @description shows alert as specified by alertOptions parameter
   * @param alertOptions
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
