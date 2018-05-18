import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { TranslateService } from "@ngx-translate/core";
import {Storage} from "@ionic/storage";
import {ISession} from "../../providers/login-provider/interfaces";

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

  session:string = "";

  constructor(
      public navCtrl: NavController,
      public translate: TranslateService,
      private storage: Storage) {

    this.storage.get("session").then(
      session => {
        this.session = JSON.stringify(session);
      }
    )
  }
}
