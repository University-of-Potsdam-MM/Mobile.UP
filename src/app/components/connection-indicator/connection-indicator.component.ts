import { Component, OnInit } from '@angular/core';
import { ConnectionIndicatorPopoverComponent } from './connection-indicator-popover/connection-indicator-popover.component';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-connection-indicator',
  templateUrl: './connection-indicator.component.html',
  styleUrls: ['./connection-indicator.component.scss'],
})
export class ConnectionIndicatorComponent implements OnInit {

  indicator;

  constructor(
    private popoverCtrl: PopoverController
  ) {
    this.indicator = navigator;
  }

  ngOnInit() {}

  async openPopover(ev) {
    const popover = await this.popoverCtrl.create({
      component: ConnectionIndicatorPopoverComponent,
      animated: true,
      event: ev,
      showBackdrop: true
    });
    return await popover.present();
  }

}
