import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AppInfoPage } from './app-info';

@NgModule({
  declarations: [
    AppInfoPage,
  ],
  imports: [
    IonicPageModule.forChild(AppInfoPage),
  ],
})
export class AppInfoPageModule {}
