import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, LoadingController, Loading } from 'ionic-angular';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
import { HomePage } from '../home/home';
import { AlertController } from 'ionic-angular/components/alert/alert-controller';
import { AuthState } from '../../library/enums';
import { Location } from '@angular/common';

// Reference: https://devdactic.com/login-ionic-2/

/**
 * LoginPage
 * 
 * this page manages logging into the application. It shows a login mask
 * and uses AuthServiceProvider to manage authentication.
 */
@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  loading: Loading;
  texts = require("./login.texts.json");
  
  // This object will hold the data the user enters in the login form
  loginCredentials = {
    id: '', 
    password: ''
  };

  constructor(
      public loadingCtrl: LoadingController,
      public alertCtrl: AlertController,
      private auth: AuthServiceProvider,
      private location: Location) {

  }

  /**
   * login
   * 
   * Uses AuthServiceProvider to execute login. If login is successful the user
   * is taken back to the previous page. If not, an alert is shown.
   */
  public login () {
    // show nice loading animation while logging in, although it should not take
    // too long
    this.showLoading();

    this.auth.login(this.loginCredentials)
      .subscribe(
        authStateResponse => {
          // now we got a response and can end the loading animation 
          this.endLoading();

          if (authStateResponse == AuthState.OK) {
            // take back user to previous page
            this.location.back();
          } else {
            // show an alert fitting the response
            this.showAlert(authStateResponse); 
          }
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
