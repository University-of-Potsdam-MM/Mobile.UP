import { Component, ViewChild } from '@angular/core';
import { Platform, Nav } from 'ionic-angular';
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
import {
  IOIDCUserInformationResponse,
  IOIDCRefreshResponseObject,
  ISession
} from "../providers/login-provider/interfaces";
import { UPLoginProvider } from "../providers/login-provider/login";
import * as moment from 'moment';

@Component({
  templateUrl: 'app.html'
})
export class MobileUPApp {
  @ViewChild(Nav) nav: Nav;

  config:IConfig;
  rootPage: any;

  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private translate: TranslateService,
    private storage: Storage,
    private http: HttpClient,
    private settingsProvider: SettingsProvider,
    private webIntent: WebIntentProvider,
    private cache: CacheService,
    private loginProvider: UPLoginProvider
  ) {
    this.initializeApp();
  }

    /**
   * initializes the app and hides splashscreen when it's done
   */
  private async initializeApp() {
    await this.initConfig();
    await this.checkSessionValidity();
    await this.initTranslate();

    this.platform.ready().then(() => {
      if (this.platform.is("cordova")) {
        this.statusBar.styleDefault();

        // set status bar to same color as header
        this.statusBar.backgroundColorByHexString('#EDEDED');
        this.splashScreen.hide();
      }

      this.cache.setDefaultTTL(60 * 60 * 2); // default cache TTL for 2 hours
      this.cache.setOfflineInvalidate(false);
    });

    this.rootPage = HomePage;
    this.nav.setRoot(HomePage, {}, { animate: true, animation: "md-transition" });
  }

  private async initConfig() {
    // TODO: maybe outsource config to a provider, so we don't need to call storage every time
    this.http.get<IConfig>("assets/config.json").subscribe(
      config => {
        this.config = config;
        this.storage.set("config", config);
        this.buildDefaultModulesList();
      }
    );
  }

  /**
   * checks whether the current session is still valid. In case it is, the
   * session will be refreshed anyway. Otherwise the currently stored session
   * object is deleted.
   */
  private async checkSessionValidity(){
    let config:IConfig = await this.storage.get('config');
    this.storage.get('session').then(
      (session:ISession) => {
        if(session) {

          // helper function for determining whether session is still valid
          let sessionIsValid = (timestampThen:Date, expiresIn:number, boundary:number) => {
            // determine date until the token is valid
            let validUntilUnixTime = moment(session.timestamp).unix() + expiresIn;
            let nowUnixTime = moment().unix();
            // check if we are not past this date already with a certain boundary

            return (validUntilUnixTime - nowUnixTime) > boundary;
          };

          if(sessionIsValid(session.timestamp,
                            session.oidcTokenObject.expires_in,
                            config.general.tokenRefreshBoundary)){
            console.log(`[MobileUP]: Session still valid, refreshing`);

            // session still valid, but we will refresh it anyway
            this.loginProvider.oidcRefreshToken(
              session.oidcTokenObject.refresh_token,
              config.authorization.oidc
            ).subscribe(
              (response:IOIDCRefreshResponseObject) => {
                // store new token object
                let newSession:ISession = {
                  oidcTokenObject:  response.oidcTokenObject,
                  token:            response.oidcTokenObject.access_token,
                  timestamp:        new Date(),
                  credentials:      session.credentials
                };
                this.storage.set('session', newSession);
                console.log(`[MobileUP]: Refreshed token successfully`);

                // TODO: remove proxy when CORS issue is resolved
                config.authorization.oidc.userInformationUrl="http://localhost:8100/apiup/oauth2/userinfo";

                // in the meantime get user information and save it to storage
                this.loginProvider.oidcGetUSerInformation(newSession, config.authorization.oidc).subscribe(
                  (userInformation:IOIDCUserInformationResponse) => {
                    this.storage.set('userInformation', userInformation).then(
                      result => {
                        console.log(
                          '[MobileUP]: Successfully retrieved and stored user information'
                        )
                      }
                    );
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
            this.storage.remove('session').then(
              (result) => console.log(`[MobileUP]: Removed invalid session`)
            );
          }
        }
        // otherwise there is no session, so there is nothing to do
      }
    )
  }

  /**
   * initTranslate
   *
   * sets up translation
   */
  private async initTranslate() {
    // Set the default language for translation strings, and the current language.
    this.translate.setDefaultLang('de');

    var userLanguage = await this.settingsProvider.getSettingValue("language");

    if (userLanguage == "Deutsch") {
      this.translate.use("de");
    } else if (userLanguage == "Englisch") {
      this.translate.use("en");
    }
  }

  /**
   * builds list of default_modules that should be displayed on HomePage
   * // if there isn't already one in the storage // disabled
   * @returns {Promise<void>}
   */
  async buildDefaultModulesList() {

    // if there are no default_modules in storage
    // if (!await this.storage.get("default_modules")) {
    // console.log("[MobileUPApp]: No default moduleList in storage, creating new one from config");

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
    // }
  }


  /**
   * opens a page when link is clicked
   * @param page
   */
  public openPage(page) {
    console.log('in');
    var pageName = this.capitalizeFirstLetter(page.componentName)+'Page';

    if (page.url){
      // pages that just link to an url or app
      this.webIntent.handleWebIntent(page.componentName);
    } else if ((pageName != 'HomePage')) {
      // pages with an actual dedicated ionic page
      if (this.nav.getActive().component != pageName) {
        console.log(pageName);
        this.nav.popToRoot();
        this.nav.push(pageName);
      }
    } else if (this.nav.getActive().component != HomePage) {
      // HomePage
      this.nav.setRoot(HomePage, {}, { animate: true, animation: "md-transition" });
    }

  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}
