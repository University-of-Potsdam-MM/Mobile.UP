import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PersonsPage } from './persons';

@NgModule({
  declarations: [
  ],
  imports: [
    IonicPageModule.forChild(PersonsPage),
  ],
})
export class PersonsPageModule {}
