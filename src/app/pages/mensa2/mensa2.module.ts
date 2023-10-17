import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { Mensa2PageRoutingModule } from './mensa2-routing.module';

import { Mensa2Page } from './mensa2.page';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    Mensa2PageRoutingModule,
    TranslateModule,
    ComponentsModule,
  ],
  declarations: [Mensa2Page],
})
export class Mensa2PageModule {}
