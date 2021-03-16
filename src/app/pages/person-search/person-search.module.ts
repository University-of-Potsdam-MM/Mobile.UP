import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PersonSearchPageRoutingModule } from './person-search-routing.module';

import { PersonSearchPage } from './person-search.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PersonSearchPageRoutingModule,
  ],
  declarations: [PersonSearchPage],
})
export class PersonSearchPageModule {}
