import { Component } from '@angular/core';
import { Platform, Events, MenuController, NavController, AlertController } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { IConfig } from './lib/interfaces';
import { Storage } from '@ionic/storage';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { CacheService } from 'ionic-cache';
import { ConnectionService } from './services/connection/connection.service';
import { UserSessionService } from './services/user-session/user-session.service';
import { SettingsService } from './services/settings/settings.service';
import { ConfigService } from './services/config/config.service';
import { IOIDCUserInformationResponse, ISession, IOIDCRefreshResponseObject } from './services/login-provider/interfaces';
import { UPLoginProvider } from './services/login-provider/login';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {

  userInformation: IOIDCUserInformationResponse = null;
  loggedIn = false;
  username;

  constructor(
    private platform: Platform,
    private splashScreen: SplashScreen,
    private translate: TranslateService,
    private statusBar: StatusBar,
    private menuCtrl: MenuController,
    private cache: CacheService,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private userSession: UserSessionService,
    private setting: SettingsService,
    private connection: ConnectionService,
    private events: Events,
    private login: UPLoginProvider,
    private storage: Storage
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.prepareStorageOnAppUpdate();
      this.initTranslate();
      this.connection.initializeNetworkEvents();
      this.updateLoginStatus();
      this.cache.setDefaultTTL(60 * 60 * 2);
      this.cache.setOfflineInvalidate(false);

      this.events.subscribe('userLogin', () => {
        this.updateLoginStatus();
      });

      if (this.platform.is('cordova')) {
        if (this.platform.is('ios') || this.platform.is('android')) {
          this.statusBar.styleDefault();
        }

        this.splashScreen.hide();
      }
    });
  }

  /**
   * @name prepareStorageOnAppUpdate
   * @description clears the storage if user has a old version of the app
   */
  async prepareStorageOnAppUpdate() {
    const config = ConfigService.config;
    const savedVersion = await this.storage.get('appVersion');

    if (!savedVersion) {
      // user has never opened a 6.x version of the app, since nothing is stored
      // clear the whole storage
      this.storage.remove('config').then(() => {
        console.log('[Mobile.UP]: cleared storage');
        this.storage.set('appVersion', config.appVersion);
        this.checkSessionValidity(config);
      }, error => {
        console.log('[ERROR]: clearing storage failed');
        console.log(error);
      });
    } else {
      this.storage.set('appVersion', config.appVersion);
      this.checkSessionValidity(config);
    }
  }

  /**
   * @name checkSessionValidity
   * @description checks whether the current session is still valid. In case it is, the
   * session will be refreshed anyway. Otherwise the currently stored session
   * object is deleted.
   */
  async checkSessionValidity(config: IConfig) {
    const session: ISession = await this.userSession.getSession();

    if (session) {
      // helper function for determining whether session is still valid
      const sessionIsValid = (timestampThen: Date, expiresIn: number, boundary: number) => {
        // determine date until the token is valid
        const validUntilUnixTime = moment(timestampThen).unix() + expiresIn;
        const nowUnixTime = moment().unix();
        // check if we are not past this date already with a certain boundary

        return (validUntilUnixTime - nowUnixTime) > boundary;
      };

      if (sessionIsValid(session.timestamp, session.oidcTokenObject.expires_in, config.general.tokenRefreshBoundary)) {
        this.login.oidcRefreshToken(session.oidcTokenObject.refresh_token, config.authorization.oidc)
          .subscribe((response: IOIDCRefreshResponseObject) => {
            const newSession = {
              oidcTokenObject:  response.oidcTokenObject,
              token:            response.oidcTokenObject.access_token,
              timestamp:        new Date(),
              credentials:      session.credentials
            };

            this.userSession.setSession(newSession);

            this.login.oidcGetUserInformation(newSession, config.authorization.oidc).subscribe(userInformation => {
              this.userSession.setUserInfo(userInformation);
            }, error => {
              console.log(error);
            });
          }, error => {
            console.log('[Mobile.UP]: error refreshing token');
            console.log(error);
          });
      } else {
        // session no longer valid
        this.userSession.removeSession();
        this.userSession.removeUserInfo();
      }
    }
  }

  /**
   * @name  initTranslate
   * @description sets up translation
   */
  async initTranslate() {
    this.translate.setDefaultLang('de');
    const lang = await this.setting.getSettingValue('language');

    if (lang === 'Deutsch') {
      this.translate.use('de');
      moment.locale('de');
    } else {
      this.translate.use('en');
      moment.locale('en');
    }
  }

  async updateLoginStatus() {
    this.loggedIn = false;
    this.userInformation = undefined;
    this.username = undefined;

    const session: ISession = await this.userSession.getSession();

    if (session) {
      this.loggedIn = true;
      this.username = session.credentials.username;
    }

    this.userInformation = await this.userSession.getUserInfo();
  }

  close() {
    this.menuCtrl.close();
  }
  toHome() {
    this.close();
    this.navCtrl.navigateRoot('/home');
  }

  async doLogout() {
    this.close();
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('page.logout.title'),
      message: this.translate.instant('page.logout.affirmativeQuestion'),
      buttons: [
        {
          text: this.translate.instant('button.cancel'),
        },
        {
          text: this.translate.instant('button.ok'),
          handler: () => {
            this.userSession.removeSession();
            this.userSession.removeUserInfo();
            for (let i = 0; i < 10; i++) { this.storage.remove('studentGrades[' + i + ']'); }
            this.cache.clearAll();
            this.updateLoginStatus();
            this.navCtrl.navigateRoot('/home');
          }
        }
      ]
    });
    alert.present();
  }

  toLogin() {
    this.close();
    this.navCtrl.navigateForward('/login');
  }

  toSettings() {
    this.close();
    this.navCtrl.navigateForward('/settings');
  }

  toAppInfo() {
    this.close();
    this.navCtrl.navigateForward('/app-info');
  }

  toImprint() {
    this.close();
    this.navCtrl.navigateForward('/impressum');
  }

}
