import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import {Device} from "@ionic-native/device";

@IonicPage()
@Component({
  selector: 'page-app-info',
  templateUrl: 'app-info.html',
})
export class AppInfoPage {

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private device: Device) {
  }

}
