import { Component, ViewChild } from '@angular/core';
import { Platform, Nav } from 'ionic-angular';

import { HomePage } from '../pages/home/home';
import { EventsPage } from './../pages/events/events';
import { ImpressumPage } from '../pages/impressum/impressum';
import { EmergencyPage } from '../pages/emergency/emergency';
import { LoginPage } from "../pages/login/login";
import { LogoutPage } from "../pages/logout/logout";
import { MensaPage } from "../pages/mensa/mensa";
import { NewsPage } from './../pages/news/news';
import { PracticePage } from "../pages/practice/practice";
import { PersonsPage } from "../pages/persons/persons";
import { RoomsPage } from "../pages/rooms/rooms";
import { RoomplanPage } from "../pages/roomplan/roomplan";

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { HttpClient } from "@angular/common/http";
import { IConfig, IModule } from "../library/interfaces";
import { SettingsPage } from "../pages/settings/settings";
import {ComponentsProvider} from "../providers/components/components";

interface IPage {
  title:string;
  pageName:any;
  tabComponent?:any;
  index?:number;
  icon:string;
}

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
    private components: ComponentsProvider
  ) {
    this.initializeApp();
  }

  private async initConfig() {
    // TODO: maybe outsource config to a provider, so we don't need to call storage every time
    this.http.get<IConfig>("assets/config.json").subscribe(
      config => {
        this.config = config;
        this.storage.set("config", config).then(
          config => console.log("[MobileUPApp]: Config loaded in storage")
        )
      }
    );
  }

  private initPages() {
    this.pagesInMenu = [
      { title: "page.home.title", pageName: HomePage, icon: "home" },
      { title: "page.practice.title", pageName: PracticePage, icon: "briefcase" },
      { title: "page.persons.title", pageName: PersonsPage, icon: "people" },
      { title: "page.news.title", pageName: NewsPage, icon: "paper" },
      { title: "page.events.title", pageName: EventsPage, icon: "calendar" },
      { title: "page.rooms.title", pageName: RoomsPage, icon: "square-outline" },
      { title: "page.roomplan.title", pageName: RoomplanPage, icon: "grid" },
      { title: "page.mensa.title", pageName: MensaPage, icon: "restaurant" },
      { title: "page.emergency.title", pageName: EmergencyPage, icon: "nuclear" },
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
      emergency:EmergencyPage,
      events:EventsPage,
      practice:PracticePage,
      persons:PersonsPage,
      settings:SettingsPage
    });
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
        moduleToAdd.i18nKey = `page.${moduleToAdd.componentName}.title`;
        moduleList[moduleName] = moduleToAdd;
      }

      this.storage.set("default_modules", moduleList);
      console.log("[MobileUPApp]: Created default moduleList from config");
    }
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
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });

    this.rootPage = HomePage;
    this.nav.setRoot(HomePage);
  }

  /**
   * initTranslate
   *
   * sets up translation
   */
  private initTranslate() {
    // Set the default language for translation strings, and the current language.
    this.translate.setDefaultLang('de');

    this.storage.get("appLanguage").then((value) => {
      if (value != null) {
        this.translate.use(value);
      } else {
        this.translate.use("de");
        this.storage.set("appLanguage","de");
      }
    })

  }

  /**
   * opens a page when link is clicked
   * @param page
   */
  public openPage(page:IPage) {

    if ((page.pageName == HomePage) && (this.nav.getActive().component != HomePage)) {
      this.nav.setRoot(page.pageName);
    } else {
      if (this.nav.getActive().component != page.pageName) {
        this.nav.popToRoot();
        this.nav.push(page.pageName);
      }
    }

  }

  isActive(page:IPage) {
    let childNav = this.nav.getActiveChildNavs()[0];

    if (childNav) {
      if (childNav.getSelected() && childNav.getSelected().root === page.tabComponent) {
        return "primary";
      }
      return;
    }

    if (this.nav.getActive() && this.nav.getActive().component === page.pageName) {
      return "primary";
    }
    return;
  }

}
