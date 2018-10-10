import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { HomePage } from '../../pages/home/home';
import { ImpressumPage } from '../../pages/impressum/impressum';
import { SettingsPage } from '../../pages/settings/settings';

@Component({
  selector: 'tab-bar',
  templateUrl: 'tab-bar.html'
})
export class TabBarComponent {

  text: string;

  constructor(private navCtrl: NavController) {
  }

  openPage(pageID) {
    switch(pageID) {
      case 0: {
        if (this.navCtrl.getActive().component != HomePage) {
          this.navCtrl.setRoot(HomePage, {fromSideMenu: true});
        }
        break;
      }
      case 1: {
        this.navCtrl.push(SettingsPage);
        break;
      }
      case 2: {
        this.navCtrl.push(ImpressumPage);
        break;
      }
    }
  }

}
