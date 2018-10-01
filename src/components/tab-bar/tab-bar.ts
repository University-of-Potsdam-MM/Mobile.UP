import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { HomePage } from '../../pages/home/home';
import { EmergencyPage } from '../../pages/emergency/emergency';
import { ImpressumPage } from '../../pages/impressum/impressum';

/**
 * Generated class for the TabBarComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
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
        if (this.navCtrl.getActive().name != "HomePage") {
          this.navCtrl.setRoot(HomePage, {fromSideMenu: true});
        }
        break;
      }
      case 1: {
        this.navCtrl.push(EmergencyPage);
        break;
      }
      case 2: {
        this.navCtrl.push(ImpressumPage);
        break;
      }
    }
  }

}
