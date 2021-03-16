import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TransportPageRoutingModule } from './transport-routing.module';

import { TransportPage } from './transport.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TransportPageRoutingModule],
  declarations: [TransportPage],
})
export class TransportPageModule {}
