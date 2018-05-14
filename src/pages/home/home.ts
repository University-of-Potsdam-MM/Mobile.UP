import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { TranslateService } from "@ngx-translate/core";

/**
 * HomePage
 */
@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {

  constructor(
      public navCtrl: NavController,
      public navParams: NavParams,
      public translate: TranslateService) {
    console.log(this.translate.instant("hello"));
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
