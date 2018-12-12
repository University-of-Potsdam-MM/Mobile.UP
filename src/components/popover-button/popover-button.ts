import { Component } from '@angular/core';
import {IOIDCUserInformationResponse} from "../../providers/login-provider/interfaces";
import {MorePopoverComponent} from "../more-popover/more-popover";
import {PopoverController} from "ionic-angular";
import {Storage} from "@ionic/storage";

/**
 * Generated class for the PopoverButtonComponent component.
 *
 * See https://angular.io/api/core/Component for more info on Angular
 * Components.
 */
@Component({
  selector: 'popover-button',
  templateUrl: 'popover-button.html'
})
export class PopoverButtonComponent {

  constructor(private storage: Storage,
              private popoverCtrl: PopoverController) {}

  /**
   * presents popover
   * @param myEvent
   */
  presentPopover(myEvent) {
    this.storage.get('userInformation').then(
      (userInformation:IOIDCUserInformationResponse) => {
        console.log(userInformation);
        let popover = this.popoverCtrl.create(
          MorePopoverComponent,
          {userInformation:userInformation}
        );
        popover.present({
          ev: myEvent
        });
      }
    )
  }

}
