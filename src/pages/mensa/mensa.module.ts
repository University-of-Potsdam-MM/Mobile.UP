import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { MensaPage } from './mensa';

@NgModule({
  declarations: [
    MensaPage,
  ],
  imports: [
    IonicPageModule.forChild(MensaPage),
  ],
})
export class MensaPageModule {}
