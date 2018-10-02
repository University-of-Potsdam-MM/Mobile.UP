import { HomePage } from './../home/home';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Nav } from 'ionic-angular';
import { ImpressumPage } from '../impressum/impressum';
import { SettingsPage } from '../settings/settings';

@IonicPage()
@Component({
  selector: 'page-tabs',
  templateUrl: 'tabs.html',
})
export class TabsPage {

  tab1Root;
  tab2Root;
  tab3Root;

  myIndex:number;

  tab1PageTitle;
  tab2PageTitle;
  tab3PageTitle;

  tab1PageIcon;
  tab2PageIcon;
  tab3PageIcon;

  constructor(public navCtrl: NavController, public navParams: NavParams, private nav: Nav) {

    this.tab2Root = SettingsPage;
    this.tab2PageTitle = "page.settings.title";
    this.tab2PageIcon = "options";


    this.tab3Root = ImpressumPage;
    this.tab3PageTitle = "page.imprint.title"
    this.tab3PageIcon = "information-circle";

    if (navParams.data.tabComp) { this.tab1Root = navParams.data.tabComp } else { this.tab1Root = HomePage };
    if (navParams.data.pageTitle) { this.tab1PageTitle = navParams.data.pageTitle } else { this.tab1PageTitle = "page.home.title" };
    if (navParams.data.pageIcon) { this.tab1PageIcon = navParams.data.pageIcon} else { this.tab1PageIcon = "home" };
  }

}
