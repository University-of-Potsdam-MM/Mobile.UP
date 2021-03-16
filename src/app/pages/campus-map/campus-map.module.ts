import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CampusMapPageRoutingModule } from './campus-map-routing.module';

import { CampusMapPage } from './campus-map.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, CampusMapPageRoutingModule],
  declarations: [CampusMapPage],
})
export class CampusMapPageModule {}
