import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EmergencyPageRoutingModule } from './emergency-routing.module';

import { EmergencyPage } from './emergency.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, EmergencyPageRoutingModule],
  declarations: [EmergencyPage],
})
export class EmergencyPageModule {}
