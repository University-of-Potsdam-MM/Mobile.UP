import {
  ChangeDetectorRef,
  Component,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Router } from '@angular/router';
import { Keyboard, KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { Storage } from '@capacitor/storage';
import {
  AlertController,
  IonRouterOutlet,
  MenuController,
  ModalController,
  NavController,
  Platform,
} from '@ionic/angular';
import { AlertButton } from '@ionic/core';
import { TranslateService } from '@ngx-translate/core';
import { CacheService } from 'ionic-cache';
import jwt_decode from 'jwt-decode';
import { default as moment } from 'moment';
import { IBibSession } from './lib/interfaces';
import { AlertService } from './services/alert/alert.service';
import { ConfigService } from './services/config/config.service';
import { ConnectionService } from './services/connection/connection.service';
import { DarkModeAndroid } from './services/dark-mode-android/dist/esm';
import {
  IOIDCRefreshResponseObject,
  ISession,
} from './services/login-service/interfaces';
import { UPLoginProvider } from './services/login-service/login';
import { SettingsService } from './services/settings/settings.service';
import { UserSessionService } from './services/user-session/user-session.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
})
export class AppComponent {
  @ViewChildren(IonRouterOutlet) routerOutlets: QueryList<IonRouterOutlet>;

  loggedIn = false;
  username;
  fullName;

  bibLoggedIn = false;
  bibID;

  darkModeManual = false;

  // logger: Logger;

  triedToRefreshLogin = false;

  constructor(
    private platform: Platform,
    private router: Router,
    private translate: TranslateService,
    private menuCtrl: MenuController,
    private navCtrl: NavController,
    private userSession: UserSessionService,
    private setting: SettingsService,
    private login: UPLoginProvider,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private alertService: AlertService,
    // private loggingService: LoggingService,
    private ref: ChangeDetectorRef,
    private cache: CacheService,
    private connectionService: ConnectionService
  ) {
    this.initializeApp();
    // this.logger = this.loggingService.getLogger('[/app-component]');
  }

  initializeApp() {
    this.platform.ready().then(() => {
      if (this.platform.is('android')) {
        DarkModeAndroid.addListener('darkModeStateChanged', (state) => {
          if (state.isDarkModeOn) {
            this.darkModeManual = true;
            this.ref.detectChanges();
          } else {
            this.darkModeManual = false;
            this.ref.detectChanges();
          }
        });
      }

      this.checkSessionValidity();
      this.initTranslate();
      this.updateLoginStatus();
      this.cache.setDefaultTTL(
        ConfigService.config.webservices.defaultCachingTTL
      );
      this.cache.setOfflineInvalidate(false);

      if (this.platform.is('ios') || this.platform.is('android')) {
        this.initKeyboard();
      }

      SplashScreen.hide();
    });
  }

  initKeyboard() {
    if (this.platform.is('ios')) {
      Keyboard.setResizeMode({ mode: KeyboardResize.Ionic });
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    this.setKeyboardStyle(prefersDark.matches || this.darkModeManual);
    prefersDark.addEventListener('change', (mediaQuery) =>
      this.setKeyboardStyle(mediaQuery.matches)
    );
  }

  setKeyboardStyle(prefersDark) {
    Keyboard.setStyle({
      style: prefersDark ? KeyboardStyle.Dark : KeyboardStyle.Light,
    });
  }

  /**
   * @name checkSessionValidity
   * @description checks whether the current session is still valid. In case it is, the
   * session will be refreshed anyway. Otherwise the currently stored session
   * object is deleted.
   */
  async checkSessionValidity() {
    let session: ISession = await this.userSession.getSession();

    if (session && (await this.connectionService.checkOnline())) {
      const variablesNotUndefined =
        session &&
        session.timestamp &&
        session.oidcTokenObject &&
        session.oidcTokenObject.expires_in &&
        ConfigService.config;
      if (
        variablesNotUndefined &&
        (await this.connectionService.checkOnline())
        // && utils.sessionIsValid(session.timestamp, session.oidcTokenObject.expires_in, ConfigService.config.general.tokenRefreshBoundary)
      ) {
        const oidcObject = ConfigService.config.authorization.oidc;

        this.login
          .oidcRefreshToken(session.oidcTokenObject.refresh_token, oidcObject)
          .subscribe(
            (response: IOIDCRefreshResponseObject) => {
              const newSession = {
                oidcTokenObject: response.oidcTokenObject,
                token: response.oidcTokenObject.access_token,
                timestamp: new Date(),
                credentials: session.credentials,
              };

              this.userSession.setSession(newSession);
            },
            (response) => {
              // this.logger.error(
              //   'checkSessionValidity',
              //   'error refreshing token',
              //   response
              // );

              if (!this.triedToRefreshLogin) {
                // refresh token expired; f.e. if user logs into a second device
                if (
                  session.credentials &&
                  session.credentials.password &&
                  session.credentials.username
                ) {
                  // this.logger.debug(
                  //   'checkSessionValidity',
                  //   're-authenticating...'
                  // );
                  this.login
                    .oidcLogin(session.credentials, oidcObject)
                    .subscribe(
                      (sessionRes) => {
                        // this.logger.debug(
                        //   'checkSessionValidity',
                        //   're-authenticating successful'
                        // );
                        this.userSession.setSession(sessionRes);
                        session = sessionRes;
                      },
                      (error) => {
                        // this.logger.error(
                        //   'checkSessionValidity',
                        //   're-authenticating not possible',
                        //   error
                        // );
                        this.loginExpired();
                      }
                    );

                  this.triedToRefreshLogin = true;
                } else {
                  this.loginExpired();
                }
              } else {
                this.loginExpired();
              }
            }
          );
      } else {
        // session no longer valid
        this.loginExpired();
      }
    }
  }

  /**
   * @name loginExpired
   * @description if device is online: performs user logout and shows toast message
   */
  async loginExpired() {
    if (await this.connectionService.checkOnline()) {
      this.performLogout();
      this.navCtrl.navigateForward('/login');
      this.alertService.showToast('alert.login-expired');
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
    this.platform.backButton.subscribeWithPriority(1, async () => {
      const openMenu = await this.menuCtrl.getOpen();

      if (openMenu) {
        this.menuCtrl.close();
      } else {
        const openModal = await this.modalCtrl.getTop();

        if (openModal) {
          this.modalCtrl.dismiss();
        } else {
          const openAlert = await this.alertCtrl.getTop();

          if (openAlert) {
            this.alertCtrl.dismiss();
          } else {
            this.routerOutlets.forEach((outlet: IonRouterOutlet) => {
              if (this.router.url === '/home') {
                // eslint-disable-next-line @typescript-eslint/dot-notation
                navigator['app'].exitApp();
              } else if (outlet && outlet.canGoBack()) {
                outlet.pop();
              }
            });
          }
        }
      }
    });
  }

  async updateLoginStatus() {
    this.loggedIn = false;
    this.bibLoggedIn = false;
    this.bibID = undefined;
    this.username = undefined;
    this.fullName = undefined;

    const session: ISession = await this.userSession.getSession();
    const bibObj = await Storage.get({ key: 'bibSession' });
    const bibSession: IBibSession = JSON.parse(bibObj.value);

    if (bibSession) {
      this.bibLoggedIn = true;
      this.bibID = bibSession.oidcTokenObject.patron;
    }

    if (session && session.credentials && session.credentials.username) {
      this.loggedIn = true;
      this.username = session.credentials.username;

      if (session.oidcTokenObject && session.oidcTokenObject.id_token) {
        const decoded: any = jwt_decode(session.oidcTokenObject.id_token);
        if (decoded.name) {
          this.fullName = decoded.name;
        }
      }
    }
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
        },
      },
    ];

    this.alertService.showAlert(
      {
        headerI18nKey: 'page.logout.title',
        messageI18nKey: 'page.logout.affirmativeQuestion',
      },
      buttons
    );
  }

  doBibLogout() {
    this.close();
    const buttons: AlertButton[] = [
      {
        text: this.translate.instant('button.cancel'),
      },
      {
        text: this.translate.instant('button.ok'),
        handler: async () => {
          await Storage.remove({ key: 'bibSession' });
          // this.logger.debug('doBibLogout()', 'successfully logged out ub-user');
          this.updateLoginStatus();
          this.navCtrl.navigateRoot('/home');
        },
      },
    ];

    this.alertService.showAlert(
      {
        headerI18nKey: 'page.logout.bibTitle',
        messageI18nKey: 'page.logout.affirmativeQuestion',
      },
      buttons
    );
  }

  async performLogout() {
    this.userSession.removeSession();
    for (let i = 0; i < 10; i++) {
      await Storage.remove({ key: 'studentGrades[' + i + ']' });
    }
    await Storage.remove({ key: 'userInformation' });
    this.cache.clearAll();
    this.updateLoginStatus();
  }

  toLogin() {
    this.close();
    this.navCtrl.navigateForward('/login');
  }

  toBibLogin() {
    this.close();
    this.navCtrl.navigateForward('/library-account');
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
