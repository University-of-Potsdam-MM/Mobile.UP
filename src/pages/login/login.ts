import { Component } from '@angular/core';
import {
  IonicPage,
  LoadingController,
  Loading,
  NavController, Platform
} from 'ionic-angular';
import { HomePage } from '../home/home';
import { AlertController } from 'ionic-angular/components/alert/alert-controller';
import { AuthState } from '../../library/enums';
import { UPLoginProvider } from "../../providers/login-provider/login";
import {
  ELoginErrors,
  ICredentials,
  ISession
} from "../../providers/login-provider/interfaces";
import {TranslateService} from "@ngx-translate/core";
import { Storage } from "@ionic/storage";

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
      private navCtrl: NavController,
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

    console.log(method)

    if (this.platform.is("cordova")) {
      method = "sso";
    } else if(this.platform.is("browser")) {
      method = "credentials";
    }

    this.upLogin.login(
      this.loginCredentials,
      {
        method: method,
        moodleLoginEndpoint: "https://apiup.uni-potsdam.de/endpoints/moodleAPI/1.0/login/token.php",
        accessToken: "Bearer 031a83e6-a122-3735-99e0-9986dcee99a0",
        service: "moodle_mobile_app",
        moodlewsrestformat: "json"
      }
      ).subscribe(
      (session:ISession) => {
        this.storage.set("session", session);
        this.endLoading();
        this.navCtrl.pop();
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
