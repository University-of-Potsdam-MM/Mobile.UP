import { Component } from '@angular/core';
import {IOIDCUserInformationResponse} from "../../providers/login-provider/interfaces";
import {App, NavController, NavParams, ViewController} from "ionic-angular";
import {LogoutPage} from "../../pages/logout/logout";
import {LoginPage} from "../../pages/login/login";
import {SettingsPage} from "../../pages/settings/settings";

/**
 * Generated class for the MorePopoverComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'more-popover',
  templateUrl: 'more-popover.html'
})
export class MorePopoverComponent {

  userInformation:IOIDCUserInformationResponse = null;

  constructor(public viewCtrl: ViewController,
              private navParams:NavParams,
              private navCtrl: NavController,
              private appCtrl: App) {
    this.userInformation = <IOIDCUserInformationResponse>this.navParams.get('userInformation');
  }

  close() {
    this.viewCtrl.dismiss();
  }

  toLogout(){
    this.close();
    this.appCtrl.getRootNav().push(LogoutPage);
  }

  toLogin(){
    this.close();
    this.appCtrl.getRootNav().push(LoginPage);
  }

  toSettings(){
    this.close();
    this.appCtrl.getRootNav().push(SettingsPage);
  }

}
