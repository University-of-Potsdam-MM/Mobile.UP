import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RoomplanPageRoutingModule } from './roomplan-routing.module';

import { RoomplanPage } from './roomplan.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, RoomplanPageRoutingModule],
  declarations: [RoomplanPage],
})
export class RoomplanPageModule {}
