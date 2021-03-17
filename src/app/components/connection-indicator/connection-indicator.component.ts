import { Component, OnInit } from '@angular/core';
import { ConnectionIndicatorPopoverComponent } from './connection-indicator-popover/connection-indicator-popover.component';
import { PopoverController, Platform } from '@ionic/angular';
import { ConnectionStatus, Network } from '@capacitor/network';

@Component({
  selector: 'app-connection-indicator',
  templateUrl: './connection-indicator.component.html',
  styleUrls: ['./connection-indicator.component.scss'],
})
export class ConnectionIndicatorComponent implements OnInit {
  indicator;
  isConnected = true;

  constructor(
    private popoverCtrl: PopoverController,
    public platform: Platform
  ) {
    this.indicator = navigator;
  }

  ngOnInit() {
    this.initNetworkStatus();
    Network.addListener('networkStatusChange', (status) => {
      this.updateNetworkStatus(status);
    });
  }

  async openPopover(ev) {
    const popover = await this.popoverCtrl.create({
      component: ConnectionIndicatorPopoverComponent,
      animated: true,
      event: ev,
      showBackdrop: true,
    });
    return await popover.present();
  }

  async initNetworkStatus() {
    const status = await Network.getStatus();
    this.isConnected = status.connected;
  }

  updateNetworkStatus(status: ConnectionStatus) {
    this.isConnected = status.connected;
  }
}
