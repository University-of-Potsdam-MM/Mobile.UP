import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LibraryAccountPageRoutingModule } from './library-account-routing.module';

import { LibraryAccountPage } from './library-account.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LibraryAccountPageRoutingModule,
  ],
  declarations: [LibraryAccountPage],
})
export class LibraryAccountPageModule {}
