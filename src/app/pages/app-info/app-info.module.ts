import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AppInfoPageRoutingModule } from './app-info-routing.module';

import { AppInfoPage } from './app-info.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, AppInfoPageRoutingModule],
  declarations: [AppInfoPage],
})
export class AppInfoPageModule {}
