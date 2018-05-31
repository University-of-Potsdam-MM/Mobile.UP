import { Component, ViewChild } from '@angular/core';

import { Platform, MenuController, Nav } from 'ionic-angular';

import { HomePage } from '../pages/home/home';
import { ImpressumPage } from '../pages/impressum/impressum';
import { EmergencyPage } from '../pages/emergency/emergency';
import { LoginPage } from "../pages/login/login";
import { LogoutPage } from "../pages/logout/logout";

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { TranslateService } from "@ngx-translate/core";
import {PersonsPage} from "../pages/persons/persons";
import {Storage} from "@ionic/storage";
import {HttpClient} from "@angular/common/http";
import {IConfig} from "../library/interfaces";

interface IPage {
  title:string;
  component:any;
  thumbnail?:string;
}

@Component({
  templateUrl: 'app.html'
})
export class MobileUPApp {
  @ViewChild(Nav) nav: Nav;

  // make HomePage the root page
  rootPage = HomePage;

  // TODO: Add thumbnail to array
  pages: Array<IPage>;

  constructor(
    private platform: Platform,
    private menu: MenuController,
    private statusBar: StatusBar,
    private splashScreen: SplashScreen,
    private translate: TranslateService,
    private storage: Storage,
    private http: HttpClient
  ) {
    this.initializeApp();
  }

  private async initConfig() {
    let config:IConfig = await this.storage.get("config");
    if(!config){
      // load config if not in storage
      this.http.get<IConfig>("assets/config.json").subscribe(
        config => {
          console.log(config);
          this.storage.set("config", config);
        }
      );
    }
  }

  private initPages(){

    // set our app's pages. Titles can be used for translation when showing the
    // tiles
    this.pages = [
      {
        title: "home",
        component: HomePage
      },
      {
        title: "impress",
        component: ImpressumPage
      },
      {
        title: "emergency",
        component: EmergencyPage
      },
      {
        title: "personSearch",
        component: PersonsPage
      },
      {
        title: "login",
        component: LoginPage
      },
      {
        title: "logout",
        component: LogoutPage
      }
    ];
  }

  /**
   * initializes the app and hides splashscreen when it's done
   */
  private initializeApp() {
    this.initPages();
    this.initConfig();
    this.translate.setDefaultLang('de');
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  /**
   * opens a page when link is clicked
   * @param page
   */
  public openPage(page) {
    // close the menu when clicking a link from the menu
    this.menu.close();
    // navigate to the new page if it is not the current page
    this.nav.push(page.component);
  }
}
