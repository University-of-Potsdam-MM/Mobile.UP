import { Component, ViewChild } from '@angular/core';
import { Platform, App, Nav, MenuController, Events } from 'ionic-angular';
import { HomePage } from '../pages/home/home';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { HttpClient } from "@angular/common/http";
import { IConfig, IModule } from "../library/interfaces";
import { SettingsProvider } from '../providers/settings/settings';
import { WebIntentProvider } from '../providers/web-intent/web-intent';
import { CacheService } from 'ionic-cache';
import { IOIDCRefreshResponseObject, IOIDCUserInformationResponse } from "../providers/login-provider/interfaces";
import { UPLoginProvider } from "../providers/login-provider/login";
import * as moment from 'moment';
import { ConnectionProvider } from "../providers/connection/connection";
import { SessionProvider } from '../providers/session/session';

import { LogoutPage } from "../pages/logout/logout";
import { LoginPage } from "../pages/login/login";
import { SettingsPage } from "../pages/settings/settings";
import { AppInfoPage } from "../pages/app-info/app-info";
import { ImpressumPage } from '../pages/impressum/impressum';

@Component({
  templateUrl: 'app.html'
})
export class MobileUPApp {
  @ViewChild(Nav) nav: Nav;

  config:IConfig;
  rootPage: string = 'HomePage';
  userInformation:IOIDCUserInformationResponse = null;
  loggedIn = false;
  username;

  constructor(
    public menuCtrl: MenuController,
    private appCtrl: App,
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private translate: TranslateService,
    private storage: Storage,
    private http: HttpClient,
    private settingsProvider: SettingsProvider,
    private webIntent: WebIntentProvider,
    private events: Events,
    private cache: CacheService,
    private loginProvider: UPLoginProvider,
    private connection: ConnectionProvider,
    private sessionProvider: SessionProvider
  ) {
    this.appStart();

    this.events.subscribe("userLogin", () => {
      this.updateLoginStatus();
    });
  }

  /**
   * @name initializeApp
   * @description initializes the app and hides splashscreen when it's done
   */
  public initializeApp() {
    this.platform.ready().then(async () => {
      await this.initConfig();
      await this.initTranslate();
      this.connection.initializeNetworkEvents();

      if (this.platform.is("cordova")) {
        if (this.platform.is("ios") || this.platform.is("android")) {
          this.statusBar.styleDefault();
          // set status bar to same color as header
          this.statusBar.backgroundColorByHexString('#EDEDED');
        }

        this.splashScreen.hide();
      }

      this.updateLoginStatus();
      this.cache.setDefaultTTL(60 * 60 * 2); // default cache TTL for 2 hours
      this.cache.setOfflineInvalidate(false);
    });
  }

  appStart() {
    this.platform.ready().then(() => {
      this.http.get<IConfig>("assets/config.json").subscribe((config:IConfig) => {
        let currentAppVersion = config.appVersion;
        this.storage.get("appVersion").then(async (savedAppVersion) => {
          if (!savedAppVersion || savedAppVersion == null) {
            // user has never opened a 6.x version of the app, since nothing is stored
            // clear the whole storage
            console.log("clearing storage...");
            await this.sessionProvider.removeSession();
            await this.sessionProvider.removeUserInfo();
            await this.storage.clear().then(done => {
              this.storage.set("appVersion", currentAppVersion);
              this.initializeApp();
            }, error => {
              console.log("Error while clearing storage!");
              console.log(error);
            });
          } else {
            this.storage.set("appVersion", currentAppVersion);
            this.initializeApp();
          }
        });
      });
    });
  }

  private initConfig() {
    // TODO: maybe outsource config to a provider, so we don't need to call storage every time
    this.http.get<IConfig>("assets/config.json").subscribe(
      config => {
        this.config = config;
        this.storage.set("config", config);
        this.buildDefaultModulesList();
        this.checkSessionValidity();
      }
    );
  }

  /**
   * @name checkSessionValidity
   * @description checks whether the current session is still valid. In case it is, the
   * session will be refreshed anyway. Otherwise the currently stored session
   * object is deleted.
   */
  private checkSessionValidity() {
    this.platform.ready().then(async () => {
      let session = JSON.parse(await this.sessionProvider.getSession());

      if (session) {
        // helper function for determining whether session is still valid
        let sessionIsValid = (timestampThen:Date, expiresIn:number, boundary:number) => {
          // determine date until the token is valid
          let validUntilUnixTime = moment(timestampThen).unix() + expiresIn;
          let nowUnixTime = moment().unix();
          // check if we are not past this date already with a certain boundary

          return (validUntilUnixTime - nowUnixTime) > boundary;
        };

        if(sessionIsValid(session.timestamp,
                          session.oidcTokenObject.expires_in,
                          this.config.general.tokenRefreshBoundary)) {
          console.log(`[MobileUP]: Session still valid, refreshing`);
          // session still valid, but we will refresh it anyway
          this.loginProvider.oidcRefreshToken(
            session.oidcTokenObject.refresh_token,
            this.config.authorization.oidc
          ).subscribe(
            (response:IOIDCRefreshResponseObject) => {
              // store new token object
              let newSession:any = {
                oidcTokenObject:  response.oidcTokenObject,
                token:            response.oidcTokenObject.access_token,
                timestamp:        new Date(),
                credentials:      session.credentials
              };
              this.sessionProvider.setSession(newSession);


              // in the meantime get user information and save it to storage
              this.loginProvider.oidcGetUSerInformation(newSession, this.config.authorization.oidc).subscribe(
                (userInformation:any) => {
                  this.sessionProvider.setUserInfo(userInformation);
                },
                error => {
                  // user must not know if something goes wrong here, so we don't
                  // create an alert
                  console.log(`[MobileUP]: Could not retrieve user information because: ${JSON.stringify(error)}`);
                }
              );
            },
            error => {
              console.log(`[MobileUP]: Error when refreshing token: ${JSON.stringify(error)}`);
            }
          )
        } else {
          // session no longer valid, so we just remove the session object
          console.log(`[MobileUP]: Session no longer valid, deleting session object`);
          this.sessionProvider.removeSession();
        }
      }
    });
  }

  /**
   * @name  initTranslate
   * @description sets up translation
   */
  private async initTranslate() {
    // Set the default language for translation strings, and the current language.
    this.translate.setDefaultLang('de');
    moment.locale('de');

    var userLanguage = await this.settingsProvider.getSettingValue("language");

    if (userLanguage == "Deutsch") {
      this.translate.use("de");
      moment.locale('de');
    } else if (userLanguage == "Englisch") {
      this.translate.use("en");
      moment.locale('en');
    }
  }

  /**
   * @name buildDefaultModulesList
   * @description builds list of default_modules that should be displayed on HomePage
   * // if there isn't already one in the storage // disabled
   * @returns {Promise<void>}
   */
  buildDefaultModulesList() {
    let moduleList:{[modulesName:string]:IModule} = {};
    let modules = this.config.modules;

    for(let moduleName in modules) {
      let moduleToAdd:IModule = modules[moduleName];
      if (!moduleToAdd.hide) {
        moduleToAdd.i18nKey = `page.${moduleToAdd.componentName}.title`;
        moduleList[moduleName] = moduleToAdd;
      }
    }

    this.storage.set("default_modules", moduleList);
    console.log("[MobileUPApp]: Created default moduleList from config");
  }


  /**
   * @name openPage
   * @description opens a page when link is clicked
   * @param page
   */
  public openPage(page) {
    var pageName = this.capitalizeFirstLetter(page.componentName)+'Page';

    if (page.url){
      // pages that just link to an url or app
      this.webIntent.handleWebIntentForModule(page.componentName);
    } else if ((pageName != 'HomePage')) {
      // pages with an actual dedicated ionic page
      if (this.nav.getActive().component != pageName) {
        //console.log(pageName);
        this.nav.popToRoot();
        this.nav.push(pageName);
      }
    } else if (this.nav.getActive().component != HomePage) {
      // HomePage
      this.nav.setRoot(HomePage, {}, { animate: true, animation: "md-transition" });
    }

  }

  menuOpened() {
    this.updateLoginStatus();
  }

  updateLoginStatus() {
    this.loggedIn = false;
    this.userInformation = undefined;
    this.username = undefined;

    this.sessionProvider.getSession().then(session => {
      if (session) {
        let sessionParsed = JSON.parse(session);
        if (sessionParsed) {
          this.loggedIn = true;
          this.username = sessionParsed.credentials.username;
        }
      }
    });

    this.sessionProvider.getUserInfo().then(userInf => {
      if (userInf) {
        this.userInformation = JSON.parse(userInf);
      }
    });
  }

  close() {
    this.menuCtrl.close();
  }

  toHome(){
    this.close();
    this.appCtrl.getRootNavs()[0].setRoot(HomePage, {}, { animate: true, animation: "md-transition" });
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

  toImprint() {
    this.close();
    this.appCtrl.getRootNavs()[0].push(ImpressumPage);
  }

  /**
   * @name capitalizeFirstLetter
   * @description capitalizes first letter of a string
   * @param string
   * @returns string
   */
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}
