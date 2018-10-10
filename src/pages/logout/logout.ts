import { Component } from '@angular/core';
import {IonicPage, Nav} from 'ionic-angular';
import {Storage} from "@ionic/storage";
import { HomePage } from '../home/home';

/**
 * LogoutPage
 *
 * page that asks the user whether he/she really wants to be logged out
 */
@IonicPage()
@Component({
  selector: 'page-logout',
  templateUrl: 'logout.html',
})
export class LogoutPage {

  constructor(
      private storage: Storage,
      private nav: Nav) {
  }

  /**
   * performs logout by simply deleting the current session
   */
  public doLogout() {
    this.storage.set("session", null);
    this.goHome();
  }

  /**
   * takes the user back to the previous page
   */
  public goHome() {
    this.nav.setRoot(HomePage);
  }
}
