import { Component } from '@angular/core';
import { IonicPage, LoadingController, Loading, NavController, Events, AlertController } from 'ionic-angular';
import { UPLoginProvider } from '../../providers/login-provider/login';
import { ELoginErrors, ICredentials, IOIDCUserInformationResponse, ISession } from '../../providers/login-provider/interfaces';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs/Observable';
import { HomePage } from '../home/home';
import { ConnectionProvider } from '../../providers/connection/connection';
import { ConfigProvider } from '../../providers/config/config';
import { SessionProvider } from '../../providers/session/session';

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
  loginCredentials: ICredentials = {
    username: '',
    password: ''
  };

  /**
   * @constructor
   * @param navCtrl
   * @param loadingCtrl
   * @param alertCtrl
   * @param upLogin
   * @param events
   * @param connection
   * @param sessionProvider
   * @param translate
   */
  constructor(
      private navCtrl: NavController,
      private loadingCtrl: LoadingController,
      private alertCtrl: AlertController,
      private upLogin: UPLoginProvider,
      private events: Events,
      private connection: ConnectionProvider,
      private sessionProvider: SessionProvider,
      private translate: TranslateService) {
  }

  /**
   * @async
   * @name ngOnInit
   */
  async ngOnInit() {
    this.connection.checkOnline(true, true);

    let tmp = await this.sessionProvider.getSession();
    let session = undefined;
    if (tmp) {
      if (typeof tmp !== 'object') {
        session = JSON.parse(tmp);
      } else { session = tmp; }
    }

    if (session) {
      this.alreadyLoggedIn = true;
    } else { this.alreadyLoggedIn = false; }
  }

   /**
   * @async
   * @name login
   * @description Uses AuthServiceProvider to execute login. If login is successful the user
   * is taken back to the previous page. If not, an alert is shown.
   */
  public async login() {

    this.showLoading();
    let config = ConfigProvider.config;

    // prepare Observable for use in switch
    let session:Observable<ISession> = this.upLogin.oidcLogin(
      this.autoCorrectUsername(this.loginCredentials),
      config.authorization.oidc
    );

    if(session) {
      // now handle the Observable which hopefully contains a session
      session.subscribe(
        (session: any) => {
          console.log(`[LoginPage]: Login successfully executed. Token: ${session.token}`);
          this.sessionProvider.setSession(session);

          this.endLoading();

          // in the meantime get user information and save it to storage
          this.upLogin.oidcGetUSerInformation(session, config.authorization.oidc).subscribe(
            (userInformation: IOIDCUserInformationResponse) => {
              this.sessionProvider.setUserInfo(userInformation);
            },
            (error) => {
              // user must not know if something goes wrong here, so we don't
              // create an alert
              console.log(`[LoginPage]: Could not retrieve user information because:\n${JSON.stringify(error)}`);
            }
          );

          setTimeout(() => {
            this.events.publish('userLogin');
            this.navCtrl.pop();
          }, 1000);
        },
        error => {
          console.log(error);
          this.endLoading();
          this.showAlert(error.reason);
        }
      );
    } else {
      this.showAlert(ELoginErrors.UNKNOWN_ERROR);
      console.log('[LoginPage]: Somehow no session has been passed by login-provider');
    }
  }


  /**
   * @name autoCorrectUsername
   * @param {ICredentials} loginCredentials
   */
  autoCorrectUsername(loginCredentials: ICredentials) {
    // removes everything after (and including) @ in the username
    let foundAt = loginCredentials.username.indexOf("@");
    if (foundAt !== -1) {
      loginCredentials.username = loginCredentials.username.substring(0, foundAt);
      this.loginCredentials.username = loginCredentials.username;
    }

    return loginCredentials;
  }


  /**
   * @name showLoading
   * @description shows a loading animation
   */
  private showLoading(): void {
    this.loading = this.loadingCtrl.create({
      content: this.translate.instant('page.login.loginInProgress'),
      dismissOnPageChange: true,
      spinner: 'crescent'
    });
    this.loading.present();
  }


  /**
   * @name endLoading
   * @description ends the loading animation
   */
  private endLoading(): void {
    this.loading.dismiss();
  }


  /**
   * @name showAlert
   * @param errorCode
   */
  private showAlert(errorCode: ELoginErrors): void {

    let alert = this.alertCtrl.create({
      title: this.translate.instant('alert.title.error'),
      subTitle: this.translate.instant(`page.login.loginError.${errorCode}`),
      buttons: [ this.translate.instant('button.continue') ]
    });
    alert.present();
  }

  public abort() {
    this.navCtrl.setRoot(HomePage,{}, {animate: true, direction: 'forward'});
  }

}
