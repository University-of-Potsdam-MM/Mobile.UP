import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { EmergencyPage } from './emergency';

@NgModule({
  declarations: [
    EmergencyPage,
  ],
  imports: [
    IonicPageModule.forChild(EmergencyPage),
  ],
})
export class EmergencyPageModule {}
