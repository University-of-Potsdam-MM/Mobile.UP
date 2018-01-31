import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';

/**
 * HomePage
 * 
 * the page that is shown when the app is opened. Right now it just tells you
 * whether you are logged in and allows you to log in or out.
 */
@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {

  texts = require("./home.texts");

  constructor(
      public navCtrl: NavController, 
      public navParams: NavParams,
      public auth: AuthServiceProvider) {
    
    this.auth.getUserInfo();
  }

  /**
   * openLoginPage
   * 
   * opens the LoginPage
   */
  openLoginPage(): void {
    this.navCtrl.push("LoginPage");
  }

  /**
   * openLogoutPage
   * 
   * opens the LogoutPage
   */
  openLogoutPage(): void {
    this.navCtrl.push("LogoutPage");
  }

}
