import { Component, ViewChild } from '@angular/core';
import { Platform, Nav } from 'ionic-angular';
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
    private cache: CacheService
  ) {
    this.initializeApp();
  }

    /**
   * initializes the app and hides splashscreen when it's done
   */
  private async initializeApp() {
    await this.initConfig();
    await this.initPages();
    await this.initTranslate();
    await this.buildDefaultModulesList();

    this.platform.ready().then(() => {
      if (this.platform.is("cordova")) {
        this.statusBar.styleDefault();
        this.splashScreen.hide();
      }

      this.cache.setDefaultTTL(60 * 60 * 2); // default cache TTL for 2 hours
    });

    this.rootPage = HomePage;
    this.nav.setRoot(HomePage);
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

  private initPages() {
    this.pagesInMenu = [
      { title: "page.home.title", pageName: HomePage, icon: "home" },
      { title: "page.practice.title", pageName: PracticePage, icon: "briefcase" },
      { title: "page.persons.title", pageName: PersonsPage, icon: "people" },
      { title: "page.events.title", pageName: EventsPage, icon: "calendar" },
      { title: "page.rooms.title", pageName: RoomsPage, icon: "square-outline" },
      { title: "page.roomplan.title", pageName: RoomplanPage, icon: "grid" },
      { title: "page.athletics.title", pageName: HomePage, icon: "american-football", webIntent: true, moduleName: "athletics"},
      { title: "page.unishop.title", pageName: HomePage, icon: "pricetags", webIntent: true, moduleName: "unishop"},
      { title: "page.moodle.title", pageName: HomePage, icon: "help", webIntent: true, moduleName: "moodle"},
      { title: "page.reflectUP.title", pageName: HomePage, icon: "help", webIntent: true, moduleName: "reflectUP"},
      { title: "page.emergency.title", pageName: EmergencyPage, icon: "nuclear" },
      { title: "page.lectures.title", pageName: LecturesPage, icon: "book" },
      { title: "page.login.title", pageName: LoginPage, icon: "log-in" },
      { title: "page.logout.title", pageName: LogoutPage, icon: "log-out" }
    ];

    // tells ComponentsProvider which component to use for which page
    // TODO: should really be united with stuff above
    this.components.setComponents({
      login:LoginPage,
      logout:LogoutPage,
      news:NewsPage,
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
   * builds list of default_modules that should be displayed on HomePage if
   * there isn't already one in the storage
   * @returns {Promise<void>}
   */
  async buildDefaultModulesList(){

    // if there are no default_modules in storage
    if(!await this.storage.get("default_modules")){
      console.log("[MobileUPApp]: No default moduleList in storage, creating new one from config");

      let moduleList:{[modulesName:string]:IModule} = {};
      let modules = this.config.modules;

      for(let moduleName in modules){
        let moduleToAdd:IModule = modules[moduleName];
        if (!moduleToAdd.hide){
          moduleToAdd.i18nKey = `page.${moduleToAdd.componentName}.title`;
          moduleList[moduleName] = moduleToAdd;
        }
      }

      this.storage.set("default_modules", moduleList);
      console.log("[MobileUPApp]: Created default moduleList from config");
    }
  }

  /**
   * opens a page when link is clicked
   * @param page
   */
  public openPage(page:IPage) {

    if ((page.pageName != HomePage)) {
      // pages with an actual dedicated ionic page
      if (this.nav.getActive().component != page.pageName) {
        this.nav.popToRoot();
        this.nav.push(page.pageName);
      }
    } else if (page.webIntent) {
      // pages that just link to an url or app
      this.webIntent.handleWebIntent(page.moduleName);
    } else if (this.nav.getActive().component != HomePage) {
      // HomePage
      this.nav.setRoot(HomePage);
    }

  }

  isActive(page:IPage) {
    if (this.nav.getActive() && this.nav.getActive().component == page.pageName) {
      if (page.pageName != HomePage) {
        return "primary";
      }
    }
    return;
  }
}
