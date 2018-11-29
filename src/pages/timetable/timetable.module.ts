import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TimetablePage } from './timetable';

@NgModule({
  declarations: [
    TimetablePage,
  ],
  imports: [
    IonicPageModule.forChild(TimetablePage),
  ],
})
export class TimetablePageModule {}
