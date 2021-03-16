import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LibrarySearchPageRoutingModule } from './library-search-routing.module';

import { LibrarySearchPage } from './library-search.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LibrarySearchPageRoutingModule,
  ],
  declarations: [LibrarySearchPage],
})
export class LibrarySearchPageModule {}
