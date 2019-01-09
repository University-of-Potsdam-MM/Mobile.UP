import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {AlertController} from "ionic-angular";
import {ConfigProvider} from "../config/config";

export enum EErrorType {
  HTTP, SYSTEM, OTHER
}

export interface IAlertOptions {
  type:EErrorType;
  sendToLoggingAPI:boolean;
}

@Injectable()
export class AlertProvider {

  constructor(public http: HttpClient,
              private alertCtrl: AlertController) {
  }

  showAlert(alertOptions:IAlertOptions){

    let alert = this.alertCtrl.create({

    });

    alert.present();
  }

}2
