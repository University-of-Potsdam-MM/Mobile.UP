import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GradesPageRoutingModule } from './grades-routing.module';

import { GradesPage } from './grades.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, GradesPageRoutingModule],
  declarations: [GradesPage],
})
export class GradesPageModule {}
