import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import {HomePage, PopoverComponent} from './home';

@NgModule({
  declarations: [
    PopoverComponent
  ],
  imports: [
    IonicPageModule.forChild(HomePage),
  ],
})
export class HomePageModule {}
