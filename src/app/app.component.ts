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
    private translate: TranslateService
  ) {
    this.initializeApp();
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
    this.nav.setRoot(page.component);
  }
}
