import { Component } from '@angular/core';
import { IonicPage } from 'ionic-angular';
import { Location } from '@angular/common';

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

  texts = require("./logout.texts.json");

  constructor(
      private location: Location) {
  }

  /**
   * doLogout
   *
   * uses AuthServiceProvider do do logout and take user back to the previous
   * page
   */
  public doLogout() {

  }

  /**
   * goBack
   *
   * takes the user back to the previous page
   */
  public goBack() {
    this.location.back();
  }
}
