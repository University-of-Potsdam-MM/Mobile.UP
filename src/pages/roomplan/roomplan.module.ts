import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { RoomplanPage } from './roomplan';

@NgModule({
  declarations: [
    RoomplanPage,
  ],
  imports: [
    IonicPageModule.forChild(RoomplanPage),
  ],
})
export class RoomplanPageModule {}
