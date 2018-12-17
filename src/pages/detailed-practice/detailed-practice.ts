import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

/**
 * Generated class for the DetailedPracticePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-detailed-practice',
  templateUrl: 'detailed-practice.html',
})
export class DetailedPracticePage {

  ADS;
  displayedList;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.ADS = this.navParams.data.ADS;
    this.displayedList = this.navParams.data.list;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad DetailedPracticePage');
  }

}
