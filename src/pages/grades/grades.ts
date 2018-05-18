import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import {Storage} from "@ionic/storage";
import {ISession} from "../../providers/login-provider/interfaces";
import {LoginPage} from "../login/login";

/**
 * Generated class for the GradesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-grades',
  templateUrl: 'grades.html',
})
export class GradesPage {

  constructor(
      public navCtrl:   NavController,
      public navParams: NavParams,
      private storage:  Storage) {

  }

  public goToLogin(){
    this.navCtrl.push(LoginPage);
  }

  public showGrades(){
    // no chached grades!
  }

  public ionViewDidLoad() {
    this.storage.get("session").then(
      (session:ISession) => {
        if(session){

        } else {
          this.goToLogin();
        }
    }
    )
  }
}
