import { Component } from '@angular/core';
import {
  IonicPage,
  LoadingController,
  Loading,
  Platform, Nav
} from 'ionic-angular';
import { AlertController } from 'ionic-angular/components/alert/alert-controller';
import { UPLoginProvider } from "../../providers/login-provider/login";
import {
  ELoginErrors,
  ICredentials,
  ISession
} from "../../providers/login-provider/interfaces";
import {TranslateService} from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import {IConfig} from "../../library/interfaces";
import { TabsPage } from '../tabs/tabs';

/**
 * LoginPage
 *
 * this page manages logging into the application. It shows a login mask
 * and uses UPLoginProvider to manage authentication.
 */
@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  loading: Loading;

  // This object will hold the data the user enters in the login form
  loginCredentials:ICredentials = {
    username: '',
    password: ''
  };

  constructor(
      private nav: Nav,
      private loadingCtrl: LoadingController,
      private alertCtrl:   AlertController,
      private upLogin:     UPLoginProvider,
      private storage:     Storage,
      private translate:   TranslateService,
      private platform:    Platform) {
  }

  /**
   * login
   *
   * Uses AuthServiceProvider to execute login. If login is successful the user
   * is taken back to the previous page. If not, an alert is shown.
   */
  public async login () {

    this.showLoading();

    let method:string = "";
    let source:string = await this.platform.ready();

    switch(source){
      case "dom": { method = "credentials"; break; }
      case "cordova": { method = "sso"; break; }
      default: { method = "credentials"; break; }
    }

    let config:IConfig = await this.storage.get("config");

    this.upLogin.login(
      this.loginCredentials,
      config.authorization[method]
    ).subscribe(
      (session:ISession) => {
        console.log(`[LoginPage]: Login successfully executed. Token: ${session.token}`);
        this.storage.set("session", session);
        this.endLoading();
        this.nav.setRoot(TabsPage);
      },
      error => {
        console.log(error);
        this.endLoading();
        this.showAlert(error.reason)
      }
    );


  }

  /**
   * showLoading
   *
   * shows a loading animation
   */
  private showLoading(): void {
    this.loading = this.loadingCtrl.create({
      content: this.translate.instant("page.login.loginInProgress"),
      dismissOnPageChange: true,
      spinner: "crescent"
    });
    this.loading.present();
  }

  /**
   * endLoading
   *
   * ends the loading animation
   */
  private endLoading(): void {
    this.loading.dismiss();
  }

  /**
   * showAlert
   *
   * shows an alert
   */
  private showAlert(errorCode: ELoginErrors): void {

    let alert = this.alertCtrl.create({
      title: this.translate.instant("alert.title.error"),
      subTitle: this.translate.instant(`page.login.loginError.${errorCode}`),
      buttons: [ this.translate.instant("button.continue") ]
    });
    alert.present();
  }

}
