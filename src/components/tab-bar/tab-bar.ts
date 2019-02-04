import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { HomePage } from '../../pages/home/home';
import { ImpressumPage } from '../../pages/impressum/impressum';

@Component({
  selector: 'tab-bar',
  templateUrl: 'tab-bar.html'
})
export class TabBarComponent {

  constructor(private navCtrl: NavController) {
  }

  openPage(pageID) {
    switch(pageID) {
      case 0: {
        if (this.navCtrl.getActive().component != HomePage) {
          this.navCtrl.setRoot(HomePage, {}, { animate: true, animation: "md-transition" });
        }
        break;
      }
      case 1: {
        this.navCtrl.push(ImpressumPage);
        break;
      }
    }
  }

}
