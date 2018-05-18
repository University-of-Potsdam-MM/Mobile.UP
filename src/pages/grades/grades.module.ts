import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { GradesPage } from './grades';

@NgModule({
  declarations: [
    GradesPage,
  ],
  imports: [
    IonicPageModule.forChild(GradesPage),
  ],
})
export class GradesPageModule {}
