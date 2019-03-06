import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network/ngx';
import { AlertController, Events, NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

export enum EConnection {
  OFFLINE, ONLINE
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {

  connectionState: EConnection;

  constructor(private network: Network,
              private alertCtrl: AlertController,
              private translate: TranslateService,
              private navCtrl: NavController,
              private eventCtrl: Events) {
    if (this.network.type === this.network.Connection.NONE) {
      this.connectionState = EConnection.OFFLINE;
    } else { this.connectionState = EConnection.ONLINE; }
  }

  /**
   * initializes the network event callbacks so network events are registered.
   * Should be called in app.component.ts
   */
  initializeNetworkEvents(): void {
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
    console.log('[ConnectionProvider]: Initialized network events');
  }

  /**
   * checkOnline
   *
   * returns connection state. Set showAlert and/or sendHome to true to show an alert
   * about the connection state or/and send the user to HomePage
   * @return Observable<boolean>
   */
  checkOnline(showAlert: boolean = false, sendHome: boolean = false): EConnection {
    if (this.connectionState === EConnection.OFFLINE) {
      if (showAlert) {
        this.showAlert();
      }

      if (sendHome) {
        this.navCtrl.navigateRoot('/home');
      }
    }

    console.log(`[ConnectionProvider]: App is ${EConnection[this.connectionState]}`);
    return this.connectionState;
  }

  async showAlert() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('alert.title.error'),
      message: this.translate.instant('alert.network'),
      buttons: [
        this.translate.instant('button.continue')
      ]
    });
    alert.present();
  }
}
