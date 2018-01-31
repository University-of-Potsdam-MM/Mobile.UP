import {
  Component
} from '@angular/core';
import {
  IonicPage,
  NavController,
  NavParams
} from 'ionic-angular';

/**
 * ImpressumPage
 * 
 * shows the impressum text. 
 */
@IonicPage()
@Component({
  selector: 'page-impressum',
  templateUrl: 'impressum.html',
})
export class ImpressumPage {

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams) {}
}
