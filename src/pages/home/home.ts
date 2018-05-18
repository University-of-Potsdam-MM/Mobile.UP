import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { TranslateService } from "@ngx-translate/core";
import {Storage} from "@ionic/storage";

/**
 * HomePage
 *
 * TODO: Add gridster or similar here
 */
@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {

  constructor(
      public navCtrl: NavController,
      public translate: TranslateService,
      private storage: Storage) {

    this.storage.get("session").then(
      session => {
        if(session) {
          console.log("Session found:")
          console.log(session);
        } else {
          console.log("No session")
        }
      }
    )
  }
}
