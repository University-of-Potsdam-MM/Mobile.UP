import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { LecturesPageRoutingModule } from './lectures-routing.module';
import { LecturesPage } from './lectures.page';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ComponentsModule } from 'src/app/components/components.module';
import { HttpLoaderFactory } from 'src/app/app.module';
import { LectureSearchModalPage } from './lecture-search.modal';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LecturesPageRoutingModule,
    ComponentsModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  declarations: [LecturesPage, LectureSearchModalPage],
})
export class LecturesPageModule {}
