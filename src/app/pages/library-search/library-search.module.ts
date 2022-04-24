import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpLoaderFactory } from 'src/app/app.module';
import { BookDetailModalPage } from 'src/app/components/book-list/book-detail.modal';
import { ComponentsModule } from 'src/app/components/components.module';
import { LibrarySearchPageRoutingModule } from './library-search-routing.module';
import { LibrarySearchPage } from './library-search.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LibrarySearchPageRoutingModule,
    ComponentsModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  declarations: [LibrarySearchPage, BookDetailModalPage],
})
export class LibrarySearchPageModule {}
