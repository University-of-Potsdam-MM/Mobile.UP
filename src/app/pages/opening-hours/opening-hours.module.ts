import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { OpeningHoursPageRoutingModule } from './opening-hours-routing.module';

import { OpeningHoursPage } from './opening-hours.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OpeningHoursPageRoutingModule,
  ],
  declarations: [OpeningHoursPage],
})
export class OpeningHoursPageModule {}
