import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MensaPageRoutingModule } from './mensa-routing.module';

import { MensaPage } from './mensa.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, MensaPageRoutingModule],
  declarations: [MensaPage],
})
export class MensaPageModule {}
