import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TimetablePageRoutingModule } from './timetable-routing.module';

import { TimetablePage } from './timetable.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, TimetablePageRoutingModule],
  declarations: [TimetablePage],
})
export class TimetablePageModule {}
