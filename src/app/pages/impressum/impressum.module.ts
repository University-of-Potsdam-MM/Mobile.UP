import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ImpressumPageRoutingModule } from './impressum-routing.module';

import { ImpressumPage } from './impressum.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, ImpressumPageRoutingModule],
  declarations: [ImpressumPage],
})
export class ImpressumPageModule {}
