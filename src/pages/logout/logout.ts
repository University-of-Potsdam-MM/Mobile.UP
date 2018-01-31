import { Component } from '@angular/core';
import { IonicPage } from 'ionic-angular';
import { AuthServiceProvider } from '../../providers/auth-service/auth-service';
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
      private location: Location,
      public auth: AuthServiceProvider) {
  }

  /**
   * doLogout
   * 
   * uses AuthServiceProvider do do logout and take user back to the previous
   * page
   */
  public doLogout() {
    this.auth.logout().subscribe(
      next => {
        if(next == true){
          this.goBack();
        } else {
          // figure out what went wrong. But what can go wrong here anyway?
        }
      },
      error => {
        console.log(error);
      }
    )
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
