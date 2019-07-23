import { Component, QueryList, ViewChildren } from '@angular/core';
import { Platform, Events, MenuController, NavController, IonRouterOutlet } from '@ionic/angular';
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
import { Router } from '@angular/router';
import { AlertService } from './services/alert/alert.service';
import { AlertButton } from '@ionic/core';
import { Logger, LoggingService } from 'ionic-logging-service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html'
})
export class AppComponent {

  @ViewChildren(IonRouterOutlet) routerOutlets: QueryList<IonRouterOutlet>;

  userInformation: IOIDCUserInformationResponse = null;
  loggedIn = false;
  username;
  config: IConfig;
  logger: Logger;

  triedToRefreshLogin = false;

  constructor(
    private platform: Platform,
    private router: Router,
    private splashScreen: SplashScreen,
    private translate: TranslateService,
    private statusBar: StatusBar,
    private menuCtrl: MenuController,
    private cache: CacheService,
    private navCtrl: NavController,
    private userSession: UserSessionService,
    private setting: SettingsService,
    private connection: ConnectionService,
    private events: Events,
    private login: UPLoginProvider,
    private storage: Storage,
    private alertService: AlertService,
    private loggingService: LoggingService
  ) {
    this.initializeApp();
    this.logger = this.loggingService.getLogger('[/app-component]');
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.config = ConfigService.config;
      this.prepareStorageOnAppUpdate();
      this.initTranslate();
      this.connection.initializeNetworkEvents();
      this.updateLoginStatus();
      this.cache.setDefaultTTL(this.config.webservices.defaultCachingTTL);
      this.cache.setOfflineInvalidate(false);

      this.events.subscribe('userLogin', () => {
        this.updateLoginStatus();
      });

      if (this.platform.is('cordova')) {

        if (this.platform.is('android')) {
          this.listenToBackButton();
          this.statusBar.backgroundColorByHexString('#014260');
        }

        if (this.platform.is('ios')) {
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
    const savedVersion = await this.storage.get('appVersion');

    if (!savedVersion) {
      // user has never opened a 6.x version of the app, since nothing is stored
      // clear the whole storage
      this.storage.clear().then(() => {
        this.logger.debug('prepareStorageOnAppUpdate', 'cleared storage');
        this.storage.set('appVersion', this.config.appVersion);
        this.checkSessionValidity();
      }, error => {
        this.logger.error('prepareStorageOnAppUpdate', 'clearing storage failed', error);
      });
    } else {
      this.storage.set('appVersion', this.config.appVersion);
      this.checkSessionValidity();
    }
  }

  /**
   * @name checkSessionValidity
   * @description checks whether the current session is still valid. In case it is, the
   * session will be refreshed anyway. Otherwise the currently stored session
   * object is deleted.
   */
  async checkSessionValidity() {
    let session: ISession = await this.userSession.getSession();

    if (session) {
      // helper function for determining whether session is still valid
      const sessionIsValid = (timestampThen: Date, expiresIn: number, boundary: number) => {
        // determine date until the token is valid
        const validUntilUnixTime = moment(timestampThen).unix() + expiresIn;
        const nowUnixTime = moment().unix();
        // check if we are not past this date already with a certain boundary
        return (validUntilUnixTime - nowUnixTime) > boundary;
      };

      const variablesNotUndefined = session && session.timestamp && session.oidcTokenObject
        && session.oidcTokenObject.expires_in && this.config;
      if (variablesNotUndefined
        && sessionIsValid(session.timestamp, session.oidcTokenObject.expires_in, this.config.general.tokenRefreshBoundary)) {
        this.login.oidcRefreshToken(session.oidcTokenObject.refresh_token, this.config.authorization.oidc)
          .subscribe((response: IOIDCRefreshResponseObject) => {
            const newSession = {
              oidcTokenObject:  response.oidcTokenObject,
              token:            response.oidcTokenObject.access_token,
              timestamp:        new Date(),
              credentials:      session.credentials
            };

            this.userSession.setSession(newSession);

            this.login.oidcGetUserInformation(newSession, this.config.authorization.oidc).subscribe(userInformation => {
              this.userSession.setUserInfo(userInformation);
            }, error => {
              this.logger.error('checkSessionValidity', 'oidcGetUserInformation', error);
            });
          }, response => {
            this.logger.error('checkSessionValidity', 'error refreshing token', response);

            if (!this.triedToRefreshLogin) {
              this.connection.checkOnline(true, true);
              // refresh token expired; f.e. if user logs into a second device
              if (session.credentials && session.credentials.password && session.credentials.username) {
                this.logger.debug('checkSessionValidity', 're-authenticating...');
                this.login.oidcLogin(session.credentials, this.config.authorization.oidc).subscribe(sessionRes => {
                  this.logger.debug('checkSessionValidity', 're-authenticating successful');
                  this.userSession.setSession(sessionRes);
                  session = sessionRes;

                  this.login.oidcGetUserInformation(sessionRes, this.config.authorization.oidc).subscribe(userInformation => {
                    this.userSession.setUserInfo(userInformation);
                  }, error => {
                    this.logger.error('checkSessionValidity', 'oidcGetUserInformation', error);
                  });
                }, error => {
                  this.logger.error('checkSessionValidity', 're-authenticating not possible', error);
                });

                this.triedToRefreshLogin = true;
              } else {
                this.performLogout();
                this.navCtrl.navigateForward('/login');
              }
            } else {
              this.performLogout();
              this.navCtrl.navigateForward('/login');
            }
          });
      } else {
        // session no longer valid
        this.userSession.removeSession();
        this.userSession.removeUserInfo();
        setTimeout(() => {
          this.events.publish('userLogin');
        }, 1000);
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

  /**
   * listens to backbutton and closes application if backbutton is pressed on
   * home screen
   */
  listenToBackButton() {
    // workaround for #694
    // https://forum.ionicframework.com/t/hardware-back-button-with-ionic-4/137905/56
    this.platform.backButton.subscribe(async() => {
      this.routerOutlets.forEach((outlet: IonRouterOutlet) => {
        if (this.router.url === '/home') {
          navigator['app'].exitApp();
        } else {
          window.history.back();
        }
      });
    });
  }

  async updateLoginStatus() {
    this.loggedIn = false;
    this.userInformation = undefined;
    this.username = undefined;

    const session: ISession = await this.userSession.getSession();

    if (session && session.credentials && session.credentials.username) {
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

  doLogout() {
    this.close();
    const buttons: AlertButton[] = [
      {
        text: this.translate.instant('button.cancel'),
      },
      {
        text: this.translate.instant('button.ok'),
        handler: () => {
          this.performLogout();
          this.navCtrl.navigateRoot('/home');
        }
      }
    ];

    this.alertService.showAlert(
      {
        headerI18nKey: 'page.logout.title',
        messageI18nKey: 'page.logout.affirmativeQuestion'
      },
      buttons
    );
  }

  performLogout() {
    this.userSession.removeSession();
    this.userSession.removeUserInfo();
    for (let i = 0; i < 10; i++) { this.storage.remove('studentGrades[' + i + ']'); }
    this.cache.clearAll();
    this.updateLoginStatus();
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
