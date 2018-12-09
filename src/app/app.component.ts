import { Component, ViewChild } from '@angular/core';
import {
  Platform,
  Nav,
  ViewController,
  NavParams,
  PopoverController
} from 'ionic-angular';
import { HomePage } from '../pages/home/home';
import { EventsPage } from './../pages/events/events';
import { ImpressumPage } from '../pages/impressum/impressum';
import { EmergencyPage } from '../pages/emergency/emergency';
import { LoginPage } from "../pages/login/login";
import { LogoutPage } from "../pages/logout/logout";
import { PersonsPage } from "../pages/persons/persons";
import { MensaPage } from "../pages/mensa/mensa";
import { NewsPage } from './../pages/news/news';
import { PracticePage } from "../pages/practice/practice";
import { RoomsPage } from "../pages/rooms/rooms";
import { RoomplanPage } from "../pages/roomplan/roomplan";

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { HttpClient } from "@angular/common/http";
import { IConfig, IModule, IPage } from "../library/interfaces";
import { SettingsPage } from "../pages/settings/settings";
import { ComponentsProvider } from "../providers/components/components";
import { SettingsProvider } from '../providers/settings/settings';
import { WebIntentProvider } from '../providers/web-intent/web-intent';
import { LibraryPage } from '../pages/library/library';
import { GradesPage } from '../pages/grades/grades';
import { LecturesPage } from '../pages/lectures/lectures';
import { CacheService } from 'ionic-cache';
import { OpeningHoursPage } from '../pages/opening-hours/opening-hours';
import {
  IOIDCUserInformationResponse,
  IOIDCRefreshResponseObject,
  ISession
} from "../providers/login-provider/interfaces";
import { UPLoginProvider } from "../providers/login-provider/login";
import * as moment from 'moment';
import { MorePopoverComponent } from "../components/more-popover/more-popover";

@Component({
  templateUrl: 'app.html'
})
export class MobileUPApp {
  @ViewChild(Nav) nav: Nav;

  config:IConfig;
  rootPage: any;
  pagesInMenu: Array<IPage>;

  constructor(
    private platform: Platform,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private translate: TranslateService,
    private storage: Storage,
    private http: HttpClient,
    private settingsProvider: SettingsProvider,
    private webIntent: WebIntentProvider,
    private components: ComponentsProvider,
    private cache: CacheService,
    private loginProvider: UPLoginProvider,
    private popoverCtrl: PopoverController
  ) {
    this.initializeApp();
  }

    /**
   * initializes the app and hides splashscreen when it's done
   */
  private async initializeApp() {
    await this.initConfig();
    await this.checkSessionValidity();
    await this.initPages();
    await this.initTranslate();
    await this.buildDefaultModulesList();

    this.platform.ready().then(() => {
      if (this.platform.is("cordova")) {
        this.statusBar.styleDefault();
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
                this.storage.set('session', <ISession>{
                  oidcTokenObject:  response.oidcTokenObject,
                  token:            response.oidcTokenObject.access_token,
                  timestamp:        new Date(),
                  credentials:      session.credentials
                });
                console.log(`[MobileUP]: Refreshed token successfully`);

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

  private initPages() {
    // tells ComponentsProvider which component to use for which page
    this.components.setComponents({
      login:LoginPage,
      logout:LogoutPage,
      news:NewsPage,
      openingHours:OpeningHoursPage,
      imprint:ImpressumPage,
      rooms:RoomsPage,
      roomplan:RoomplanPage,
      mensa:MensaPage,
      library:LibraryPage,
      emergency:EmergencyPage,
      events:EventsPage,
      practice:PracticePage,
      persons:PersonsPage,
      settings:SettingsPage,
      grades:GradesPage,
      lectures:LecturesPage,
      athletics:"webIntent",
      unishop:"webIntent",
      mail:"webIntent",
      moodle:"webIntent",
      reflectUP:"webIntent"
    });
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

  isActive(page:IPage) {
    if (this.nav.getActive() && this.nav.getActive().component == page.pageName) {
      if (page.pageName != HomePage) {
        return "primary";
      }
    }
    return;
  }

  /**
   * presents popover
   * @param myEvent
   */
  presentPopover(myEvent) {
    this.storage.get('userInformation').then(
      (userInformation:IOIDCUserInformationResponse) => {
        console.log(userInformation)
        let popover = this.popoverCtrl.create(
          MorePopoverComponent,
          {userInformation:userInformation}
        );
        popover.present({
          ev: myEvent
        });
      }
    )
  }
}
