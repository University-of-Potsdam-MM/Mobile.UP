import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network/ngx';
import { Events, NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AlertService } from '../alert/alert.service';
import { AlertButton } from '@ionic/core';
import { Logger, LoggingService } from 'ionic-logging-service';

export enum EConnection {
  OFFLINE, ONLINE
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {

  connectionState: EConnection;
  logger: Logger;

  constructor(
    private network: Network,
    private translate: TranslateService,
    private navCtrl: NavController,
    private eventCtrl: Events,
    private alertService: AlertService,
    private loggingService: LoggingService
  ) {
    this.logger = this.loggingService.getLogger('[/connection-service]');

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
      this.logger.debug('initializeNetworkEvents', `went ${EConnection[this.connectionState]}`);
    });
    this.network.onConnect().subscribe(() => {
      if (this.connectionState === EConnection.OFFLINE) {
        this.eventCtrl.publish('connection:online');
      }
      this.connectionState = EConnection.ONLINE;
      this.logger.debug('initializeNetworkEvents', `went ${EConnection[this.connectionState]}`);
    });
    this.logger.debug('initializeNetworkEvents');
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
      if (showAlert && !sendHome) {
        this.alertService.showToast('alert.network');
      } else if (showAlert && sendHome) {
        const buttons: AlertButton[] = [{
          text: this.translate.instant('button.continue'),
          handler: () => {
            this.navCtrl.navigateRoot('/home');
          }
        }];
        this.alertService.showAlert(
          {
            headerI18nKey: 'alert.title.httpError',
            messageI18nKey: 'alert.network'
          },
          buttons
        );
      }

      if (!showAlert && sendHome) {
        this.navCtrl.navigateRoot('/home');
      }
    }

    this.logger.debug('checkOnline', `app is ${EConnection[this.connectionState]}`);
    return this.connectionState;
  }

}
