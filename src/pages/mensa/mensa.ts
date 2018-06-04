import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';


@IonicPage()
@Component({
  selector: 'page-mensa',
  templateUrl: 'mensa.html',
})
export class MensaPage {

  campus:String = '';

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.campus = "campus2";
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MensaPage');
  }

  public async changeCampus(event: any) {
    console.log(this.campus);
  }

}
