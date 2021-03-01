import { Injectable } from "@angular/core";
import { NavController, Platform } from "@ionic/angular";
import { TranslateService } from "@ngx-translate/core";
import { AlertService } from "../alert/alert.service";
import { Logger, LoggingService } from "ionic-logging-service";
import { Network } from "@ionic-native/network/ngx";

@Injectable({
  providedIn: "root",
})
export class ConnectionService {
  logger: Logger;

  constructor(
    private translate: TranslateService,
    private navCtrl: NavController,
    private alertService: AlertService,
    private loggingService: LoggingService,
    private network: Network,
    private platform: Platform
  ) {
    this.logger = this.loggingService.getLogger("[/connection-service]");
  }

  /**
   * returns connection state. Set showAlert and/or sendHome to true to show an alert
   * about the connection state or/and send the user to HomePage
   * @return boolean
   */
  checkOnline(showAlert = false, sendHome = false): boolean {
    let isOnline;
    if (this.platform.is("cordova")) {
      if (this.network.type === this.network.Connection.NONE) {
        isOnline = false;
      } else {
        isOnline = true;
      }
    } else {
      isOnline = navigator.onLine;
    }

    if (!isOnline) {
      if (showAlert && sendHome) {
        this.alertService.showAlert(
          {
            messageI18nKey: "alert.noInternetConnection",
          },
          [
            {
              text: this.translate.instant("button.continue"),
              handler: () => {
                this.navCtrl.navigateRoot("/home");
              },
            },
          ]
        );
      }

      if (!showAlert && sendHome) {
        this.navCtrl.navigateRoot("/home");
      }
    }

    this.logger.debug("checkOnline", `is app connected? -> ${isOnline}`);
    return isOnline;
  }
}
