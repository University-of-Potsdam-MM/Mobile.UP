import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {AlertController} from "ionic-angular";

@Injectable()
export class AlertProvider {



  constructor(public http: HttpClient,
              private alertCtrl: AlertController) {
    console.log('Hello AlertProvider Provider');
  }

  showAlert(alert,
            logError:boolean=false){


  }

}
