import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, Loading } from 'ionic-angular';
import { HomePage } from '../home/home';
import { AlertController } from 'ionic-angular/components/alert/alert-controller';
import { AuthState } from '../../library/enums';
import { Location } from '@angular/common';
import { UPLoginProvider } from "../../providers/login-provider/login";
import {
  ICredentials,
  ISession
} from "../../providers/login-provider/interfaces";

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

  // TODO: Add i18n

  loading: Loading;
  texts = require("./login.texts.json");

  // This object will hold the data the user enters in the login form
  loginCredentials:ICredentials = {
    username: '',
    password: ''
  };

  constructor(
      public loadingCtrl: LoadingController,
      public alertCtrl:   AlertController,
      private upLogin:    UPLoginProvider,
      private storage:    Storage) {
  }

  /**
   * login
   *
   * Uses AuthServiceProvider to execute login. If login is successful the user
   * is taken back to the previous page. If not, an alert is shown.
   */
  public login () {

    this.showLoading();

    this.upLogin.login(this.loginCredentials, {}).subscribe(
      (session:ISession) => {
        this.storage.set("session", session);
      },
      error => {
        console.log(error);
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
      content: this.texts.loading.text,
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
  private showAlert(state: AuthState): void {

    // mapping of AuthStates to according alert texts. Might be outsourced, but
    // it does not hurt to keep it in here, I guess.
    const subTitles = new Map<number, string>([
      [AuthState.CREDENTIALS, this.texts.alert.subtitles.credentials],
      [AuthState.NETWORK,     this.texts.alert.subtitles.network],
      [AuthState.OTHER,       this.texts.alert.subtitles.other]
    ]);

    let alert = this.alertCtrl.create({
      title: this.texts.alert.text,
      subTitle: subTitles.get(state),
      buttons: [this.texts.alert.button.continue]
    });
    alert.present();
  }

}
