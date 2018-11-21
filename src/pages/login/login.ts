import { Component } from '@angular/core';
import {
  IonicPage,
  LoadingController,
  Loading,
  Platform, Nav
} from 'ionic-angular';
import { AlertController } from 'ionic-angular/components/alert/alert-controller';
import { UPLoginProvider } from "../../providers/login-provider/login";
import {
  ELoginErrors,
  ICredentials,
  ISession
} from "../../providers/login-provider/interfaces";
import {TranslateService} from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import {IConfig} from "../../library/interfaces";
import {Observable} from "rxjs/Observable";
import { HomePage } from '../home/home';

/**
 * LoginPage
 *
 * this page manages logging into the application. It shows a login mask
 * and uses UPLoginProvider to manage authentication.
 */
@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {

  loading: Loading;
  alreadyLoggedIn: boolean;

  // This object will hold the data the user enters in the login form
  loginCredentials:ICredentials = {
    username: '',
    password: ''
  };

  constructor(
      private nav: Nav,
      private loadingCtrl: LoadingController,
      private alertCtrl:   AlertController,
      private upLogin:     UPLoginProvider,
      private storage:     Storage,
      private translate:   TranslateService,
      private platform:    Platform) {
  }

  async ngOnInit() {
    let session: ISession = await this.storage.get("session");
    if (session) {
      this.alreadyLoggedIn = true;
    } else { this.alreadyLoggedIn = false; }
  }

  /**
   * login
   *
   * Uses AuthServiceProvider to execute login. If login is successful the user
   * is taken back to the previous page. If not, an alert is shown.
   */
  public async login () {

    this.showLoading();

    let method:string = "";
    let source:string = await this.platform.ready();
    let config:IConfig = await this.storage.get("config");

    // first decide which login method should be executed
    switch(source){
      case "dom": { method = "credentials"; break; }
      case "cordova": { method = "sso"; break; }
      default: { method = "credentials"; break; }
    }

    // prepare Observable for use in switch
    let session:Observable<ISession> = null;

    // execute fitting login method and attach result to created Observable
    switch(method){
      case "credentials":{
        session = this.upLogin.credentialsLogin(
          this.loginCredentials,
          config.authorization.credentials
        );
        break;
      }
      case "sso":{
        session = this.upLogin.ssoLogin(
          this.loginCredentials,
          config.authorization.sso
        );
        break;
      }
    }

    if(session){
      // now handle the Observable which hopefully contains a session
      session.subscribe(
        (session:ISession) => {
          console.log(`[LoginPage]: Login successfully executed. Token: ${session.token}`);
          this.storage.set("session", session);
          this.endLoading();
          this.nav.setRoot(HomePage, {}, { animate: true, animation: "md-transition" });
        },
        error => {
          console.log(error);
          this.endLoading();
          this.showAlert(error.reason)
        }
      );
    } else {
      this.showAlert(ELoginErrors.UNKNOWN_ERROR);
      console.log("[LoginPage]: Somehow no session has been passed by login-provider");
    }
  }

  /**
   * showLoading
   *
   * shows a loading animation
   */
  private showLoading(): void {
    this.loading = this.loadingCtrl.create({
      content: this.translate.instant("page.login.loginInProgress"),
      dismissOnPageChange: true,
      spinner: "crescent"
    });
    this.loading.present();
  }

  /**
   * endLoading
   *
   * ends the loading animation
   */
  private endLoading(): void {
    this.loading.dismiss();
  }

  /**
   * showAlert
   *
   * shows an alert
   */
  private showAlert(errorCode: ELoginErrors): void {

    let alert = this.alertCtrl.create({
      title: this.translate.instant("alert.title.error"),
      subTitle: this.translate.instant(`page.login.loginError.${errorCode}`),
      buttons: [ this.translate.instant("button.continue") ]
    });
    alert.present();
  }

}
