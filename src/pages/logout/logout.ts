import { Component } from '@angular/core';
import {IonicPage, Nav} from 'ionic-angular';
import {Storage} from "@ionic/storage";
import { HomePage } from '../home/home';
import { ISession } from '../../providers/login-provider/interfaces';
import { CacheService } from 'ionic-cache';

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

  alreadyLoggedIn;

  constructor(
      private storage: Storage,
      private cache: CacheService,
      private nav: Nav) {
  }

  async ngOnInit() {
    let session: ISession = await this.storage.get("session");
    if (session) {
      this.alreadyLoggedIn = true;
    } else { this.alreadyLoggedIn = false; }
  }

  /**
   * performs logout by simply deleting the current session
   */
  public doLogout() {
    this.storage.set("session", null);
    var i; // clear saved grades from storage
    for (i = 0; i < 10; i++) { this.storage.remove("studentGrades["+i+"]"); }
    this.cache.clearAll();
    this.goHome();
  }

  /**
   * takes the user back to the previous page
   */
  public goHome() {
    this.nav.setRoot(HomePage, {}, { animate: true, animation: "md-transition" });
  }
}
