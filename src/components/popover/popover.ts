import { Component } from '@angular/core';
import { IOIDCUserInformationResponse } from "../../providers/login-provider/interfaces";
import {
  App,
  ViewController
} from "ionic-angular";
import { LogoutPage } from "../../pages/logout/logout";
import { LoginPage } from "../../pages/login/login";
import { SettingsPage } from "../../pages/settings/settings";
import { AppInfoPage } from "../../pages/app-info/app-info";
import { SessionProvider } from '../../providers/session/session';

@Component({
  selector: 'popover',
  templateUrl: 'popover.html'
})
export class PopoverComponent {

  userInformation:IOIDCUserInformationResponse = null;
  loggedIn = false;
  username;

  constructor(public viewCtrl: ViewController,
              private sessionProvider: SessionProvider,
              private appCtrl: App) {
  }

  async ionViewWillLoad() {
    let tmp = await this.sessionProvider.getSession();
    var session = undefined;
    if (tmp) {
      if (typeof tmp !== 'object') {
        session = JSON.parse(tmp);
      } else { session = tmp; }
    }

    if (session) {
      this.loggedIn = true;
      this.username = session.credentials.username;
    } else { this.loggedIn = false; }

    tmp = await this.sessionProvider.getUserInfo();
    this.userInformation = undefined;
    if (tmp) {
      if (typeof tmp !== 'object') {
        this.userInformation = JSON.parse(tmp);
      } else { this.userInformation = tmp; }
    }
  }

  close() {
    this.viewCtrl.dismiss();
  }

  toLogout(){
    this.close();
    this.appCtrl.getRootNavs()[0].push(LogoutPage);
  }

  toLogin(){
    this.close();
    this.appCtrl.getRootNavs()[0].push(LoginPage);
  }

  toSettings(){
    this.close();
    this.appCtrl.getRootNavs()[0].push(SettingsPage);
  }

  toAppInfo(){
    this.close();
    this.appCtrl.getRootNavs()[0].push(AppInfoPage);
  }
}
