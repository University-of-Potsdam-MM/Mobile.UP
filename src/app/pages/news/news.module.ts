import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NewsPageRoutingModule } from './news-routing.module';
import { NewsPage } from './news.page';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ComponentsModule } from 'src/app/components/components.module';
import { HttpLoaderFactory } from 'src/app/app.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NewsPageRoutingModule,
    ComponentsModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  declarations: [NewsPage],
})
export class NewsPageModule {}
