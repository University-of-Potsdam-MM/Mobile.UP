import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network';
import { Observable } from 'rxjs/Observable';
import {AlertController, App, Events } from 'ionic-angular';
import {TranslateService} from "@ngx-translate/core";
import {HomePage} from "../../pages/home/home";

export enum EConnection {
  OFFLINE, ONLINE
}

@Injectable()
export class ConnectionProvider {

  connectionState:EConnection;

  constructor(private network:    Network,
              private alertCtrl:  AlertController,
              private translate:  TranslateService,
              private eventCtrl:  Events,
              private app:        App) {
    if(this.network.type == this.network.Connection.NONE){
      this.connectionState = EConnection.OFFLINE;
    } else {
      this.connectionState = EConnection.ONLINE;
    }
  }

  public initializeNetworkEvents(): void {
    this.network.onDisconnect().subscribe(() => {
      if (this.connectionState === EConnection.ONLINE) {
        this.eventCtrl.publish('connection:offline');
      }
      this.connectionState = EConnection.OFFLINE;
      console.log(`[ConnectionProvider]: Went ${EConnection[this.connectionState]}`);
    });
    this.network.onConnect().subscribe(() => {
      if (this.connectionState === EConnection.OFFLINE) {
        this.eventCtrl.publish('connection:online');
      }
      this.connectionState = EConnection.ONLINE;
      console.log(`[ConnectionProvider]: Went ${EConnection[this.connectionState]}`);
    });
    console.log("[ConnectionProvider]: Initialized network events")
  }


  /**
   * checkOnline
   *
   * returns connection state. Set showAlert and/or sendHome to true to show an alert
   * about the connection state or/and send the user to HomePage
   * @return Observable<boolean>
   */
  public checkOnline(showAlert:boolean=false, sendHome:boolean=false):EConnection {
    if (this.connectionState==EConnection.OFFLINE) {
      if(showAlert){
        let alert = this.alertCtrl.create({
          title: this.translate.instant("alert.title.error"),
          subTitle: this.translate.instant("alert.network"),
          buttons: [
            this.translate.instant("button.continue")
          ]
        });
        alert.present();
      }
      if(sendHome){
        this.app.getRootNav().setRoot(HomePage);
      }
    }
    console.log(`[ConnectionProvider]: App is ${EConnection[this.connectionState]}`)

    return this.connectionState;
  }
}
