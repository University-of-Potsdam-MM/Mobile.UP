import { Component, ViewChild } from '@angular/core';
import { Platform, MenuController, Nav } from 'ionic-angular';

import { TabsPage } from './../pages/tabs/tabs';

import { HomePage } from '../pages/home/home';
import { EventsPage } from './../pages/events/events';
import { ImpressumPage } from '../pages/impressum/impressum';
import { EmergencyPage } from '../pages/emergency/emergency';
import { LoginPage } from "../pages/login/login";
import { LogoutPage } from "../pages/logout/logout";
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
    // if page should go into TABS:                             pageName: TabsPage, tabComponent: _actualPageName_, index: 0, icon: "icon-name"
    // if page should NOT go into TABS (f.e login/logout):      pageName: _actualPageName_, index: undefined, icon: "icon-name"
    // if index == 1 or index == 2 the page is hidden in the side menu
    this.pagesInMenu = [
      { title: "page.home.title", pageName: TabsPage, tabComponent: HomePage, index: 0, icon: "home" },
      { title: "page.practice.title", pageName: TabsPage, tabComponent: PracticePage, index: 0, icon: "briefcase" },
      { title: "page.persons.title", pageName: TabsPage, tabComponent: PersonsPage, index: 0, icon: "people" },
      { title: "page.news.title", pageName: TabsPage, tabComponent: NewsPage, index: 0, icon: "paper" },
      { title: "page.events.title", pageName: TabsPage, tabComponent: EventsPage, index: 0, icon: "paper" },
      { title: "page.rooms.title", pageName: TabsPage, tabComponent: RoomsPage, index: 0, icon: "square-outline" },
      { title: "page.roomplan.title", pageName: TabsPage, tabComponent: RoomplanPage, index: 0, icon: "grid" },
      { title: "page.emergency.title", pageName: TabsPage, tabComponent: EmergencyPage, index: 1, icon: "nuclear" },
      { title: "page.login.title", pageName: LoginPage, index: undefined, icon: "log-in" },
      { title: "page.logout.title", pageName: LogoutPage, index: undefined, icon: "log-out" },

      // hide in side menu, because they are visible in tab2 / tab3
      // to change which pages are visible in the tabs 2/3:  change tab2Root / tab3Root in tabs.ts
      { title: "page.settings.title", pageName: SettingsPage, tabComponent: SettingsPage, index: 0, icon: "options" },
      { title: "page.imprint.title", pageName: TabsPage, tabComponent: ImpressumPage, index: 2, icon: "information-circle" }
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

    // needed for TabsPage to load correctly
    this.rootPage = TabsPage;
    this.nav.setRoot(TabsPage);
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

    let params = {};

    if (page.index != undefined) {
      params = {
        tabComp: page.tabComponent,
        pageTitle: page.title,
        pageIcon: page.icon
      };
    }

    if (this.nav.getActiveChildNavs()[0] && page.index != undefined) {
      this.nav.setRoot(TabsPage, params);
    } else {
      this.nav.setRoot(page.pageName, params);
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

    if (this.nav.getActive() && this.nav.getActive().name === page.pageName) {
      return "primary";
    }
    return;
  }

}
