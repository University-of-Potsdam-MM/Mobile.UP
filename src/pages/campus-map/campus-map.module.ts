import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CampusMapPage } from './campus-map';

@NgModule({
  declarations: [
    CampusMapPage,
  ],
  imports: [
    IonicPageModule.forChild(CampusMapPage),
  ],
})
export class CampusMapPageModule {}
