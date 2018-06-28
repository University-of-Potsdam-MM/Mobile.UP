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

  drawerOptions:any;

  constructor(
      public navCtrl: NavController,
      public translate: TranslateService,
      private storage: Storage) {

    this.storage.get("session").then(
      session => {
        if(session) {
          console.log(`[HomePage]: Previous session found. Token: ${session.token}`);
        } else {
          console.log("[HomePage]: No previous session found");
        }
      }
    )

    this.drawerOptions = {
      handleHeight: 100,
      thresholdFromBottom: 200,
      thresholdFromTop: 400,
      bounceBack: true
    };
  }

  openPage(pageTitle:string){
    this.modules
  }
}
