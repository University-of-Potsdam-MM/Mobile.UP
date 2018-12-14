import { Component, ElementRef } from '@angular/core';
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

  constructor(private el: ElementRef,
              private storage: Storage,
              private popoverCtrl: PopoverController) {}

//wait for the component to render completely
ngOnInit() {
  var nativeElement: HTMLElement = this.el.nativeElement,
      parentElement: HTMLElement = nativeElement.parentElement;
  // move all children out of the element
  while (nativeElement.firstChild) {
      parentElement.insertBefore(nativeElement.firstChild, nativeElement);
  }
  // remove the empty element(the host)
  parentElement.removeChild(nativeElement);
}


  /**
   * presents popover
   * @param myEvent
   */
  presentPopover(myEvent) {
    this.storage.get('userInformation').then(
      (userInformation:IOIDCUserInformationResponse) => {
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
