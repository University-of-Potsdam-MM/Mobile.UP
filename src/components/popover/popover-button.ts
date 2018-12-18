import { Directive, HostListener } from '@angular/core';
import { PopoverComponent } from "./popover";
import { PopoverController } from "ionic-angular";

@Directive({
  selector: '[popoverButton]'
})
export class PopoverButton{

  constructor(private popoverCtrl: PopoverController) {}

  @HostListener('click', ['$event']) async onClick(event) {

    let popover = this.popoverCtrl.create(
      PopoverComponent
    );

    popover.present({
      ev: event
    });
  }
}