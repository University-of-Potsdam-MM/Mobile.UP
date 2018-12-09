import { Component } from '@angular/core';
import {IOIDCUserInformationResponse} from "../../providers/login-provider/interfaces";
import {NavParams, ViewController} from "ionic-angular";

/**
 * Generated class for the MorePopoverComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'more-popover',
  templateUrl: 'more-popover.html'
})
export class MorePopoverComponent {

  userInformation:IOIDCUserInformationResponse = null;

  constructor(public viewCtrl: ViewController,
              private navParams:NavParams) {
    this.userInformation = this.navParams.get('userInformation')
    console.log(this.userInformation);
  }

  close() {
    this.viewCtrl.dismiss();
  }

}
