import { Component } from '@angular/core';
import { ConnectionIndicatorPopoverComponent } from './connection-indicator-popover/connection-indicator-popover.component';
import { PopoverController, Platform } from '@ionic/angular';
import { Network } from '@ionic-native/network/ngx';

@Component({
  selector: 'app-connection-indicator',
  templateUrl: './connection-indicator.component.html',
  styleUrls: ['./connection-indicator.component.scss'],
})
export class ConnectionIndicatorComponent {

  indicator;

  constructor(
    private popoverCtrl: PopoverController,
    public network: Network,
    public platform: Platform
  ) {
    this.indicator = navigator;
  }

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
