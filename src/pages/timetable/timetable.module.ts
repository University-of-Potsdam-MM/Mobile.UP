import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
// import { EventModal } from './timetable';
import { TimetablePage} from './timetable';

@NgModule({
  declarations: [
  ],
  imports: [
    IonicPageModule.forChild(TimetablePage),
  ],
})
export class TimetablePageModule {}
