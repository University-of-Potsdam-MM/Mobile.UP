import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FreeRoomsPageRoutingModule } from './free-rooms-routing.module';

import { FreeRoomsPage } from './free-rooms.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, FreeRoomsPageRoutingModule],
  declarations: [FreeRoomsPage],
})
export class FreeRoomsPageModule {}
