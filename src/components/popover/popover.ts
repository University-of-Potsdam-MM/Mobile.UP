import { Component } from '@angular/core';
import { IOIDCUserInformationResponse } from "../../providers/login-provider/interfaces";
import {
  App,
  ViewController } from "ionic-angular";
import { LogoutPage } from "../../pages/logout/logout";
import { LoginPage } from "../../pages/login/login";
import { SettingsPage } from "../../pages/settings/settings";
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
    let session = JSON.parse(await this.sessionProvider.getSession());
    if (session) {
      this.loggedIn = true;
      this.username = session.credentials.username;
    } else { this.loggedIn = false; }

    this.userInformation = JSON.parse(await this.sessionProvider.getUserInfo());
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