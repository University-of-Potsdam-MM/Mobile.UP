import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import {Device} from "@ionic-native/device";
import {AppVersion} from "@ionic-native/app-version";

@IonicPage()
@Component({
  selector: 'page-app-info',
  templateUrl: 'app-info.html',
})
export class AppInfoPage {

  appVersionString;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private device: Device,
              private appVersion: AppVersion) {

    this.appVersion.getVersionNumber().then(
      versionNumber => this.appVersionString = versionNumber
    )
  }


}
