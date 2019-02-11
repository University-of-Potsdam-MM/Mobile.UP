import { Component } from '@angular/core';
import { IonicPage, Nav, Events } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { HomePage } from '../home/home';
import { CacheService } from 'ionic-cache';
import { SessionProvider } from '../../providers/session/session';

/**
 * @class LogoutPage
 * @classdesc page that asks the user whether he/she really wants to be logged out
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
      private events: Events,
      private sessionProvider: SessionProvider,
      private nav: Nav) {
  }

  /**
   * @async
   * @name ngOnInit
   */
  async ngOnInit() {
    let tmp = await this.sessionProvider.getSession();
    let session = undefined;
    if (tmp) {
      if (typeof tmp !== 'object') {
        session = JSON.parse(tmp);
      } else { session = tmp; }
    }

    if (session) {
      this.alreadyLoggedIn = true;
    } else { this.alreadyLoggedIn = false; }
  }

  /**
   * @name doLogout
   * @description performs logout by simply deleting the current session
   */
  public doLogout(): void {
    this.sessionProvider.removeSession();
    this.sessionProvider.removeUserInfo();
    let i; // clear saved grades from storage
    for (i = 0; i < 10; i++) { this.storage.remove('studentGrades["+i+"]'); }
    this.cache.clearAll();
    this.goHome();
  }

  /**
   * @name goHome
   * @description takes the user back to the previous page
   */
  public goHome() {
    setTimeout(() => {
      this.events.publish('userLogin');
      this.nav.setRoot(HomePage, {}, { animate: true, animation: 'md-transition' });
    }, 1000);
  }
}
