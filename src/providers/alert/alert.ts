import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {AlertController} from "ionic-angular";
import {ConfigProvider} from "../config/config";

enum EAlertType {
  ERROR, HINT
}

export interface IAlertOptions {
  type:EAlertType;
  sendToLoggingAPI:boolean;
}

interface IErrorLogging {
  message:string;
  url:string;
  line:number;
  column:number;
  uuid:string,
  jsonObject:any;
}

@Injectable()
export class AlertProvider {

  constructor(public http: HttpClient,
              private alertCtrl: AlertController) {
  }

  logError(errorObject){
    let headers:HttpHeaders = new HttpHeaders()
      .set("Authorization", "Bearer " + ConfigProvider.config.webservices.apiToken);

    this.http.post(
      ConfigProvider.config.webservices.endpoint.logging,
      errorObject,
      {headers: headers}
    ).subscribe(
      response => {
        console.log(response)
      }
    )

  }

  showAlert(error,
            alertOptions:IAlertOptions,
            logError:boolean=false){

    let alert = this.alertCtrl.create({

    });

    alert.present();

    if(alertOptions.sendToLoggingAPI){
      this.logError(error)
    }
  }

}2
