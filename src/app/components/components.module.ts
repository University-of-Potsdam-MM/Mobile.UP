import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpLoaderFactory } from '../app.module';
import { HttpClient } from '@angular/common/http';
import { HintBoxComponent } from './hint-box/hint-box.component';
import { CampusTabComponent } from './campus-tab/campus-tab.component';
import { BookListComponent } from './book-list/book-list.component';
import { FooterDisclaimerComponent } from './footer-disclaimer/footer-disclaimer.component';
import { GradesTableComponent } from './grades-table/grades-table.component';
import { LectureListComponent } from './lecture-list/lecture-list.component';
import { MensaMealComponent } from './mensa-meal/mensa-meal.component';
import { NewsArticleComponent } from './news-article/news-article.component';
import { EventViewComponent } from './event-view/event-view.component';
import { FormsModule } from '@angular/forms';
import { BookLocationComponent } from './book-location/book-location.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { CampusMapFeatureModalComponent } from './campus-map-feature-modal/campus-map-feature-modal.component';
import { CourseDataComponent } from './course-data/course-data.component';

@NgModule({
  declarations: [
    HintBoxComponent,
    CampusTabComponent,
    BookListComponent,
    FooterDisclaimerComponent,
    GradesTableComponent,
    LectureListComponent,
    MensaMealComponent,
    NewsArticleComponent,
    EventViewComponent,
    BookLocationComponent,
    CampusMapFeatureModalComponent,
    CourseDataComponent
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    LeafletModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (HttpLoaderFactory),
        deps: [HttpClient]
      }
    }),
  ],
  exports: [
    HintBoxComponent,
    CampusTabComponent,
    BookListComponent,
    FooterDisclaimerComponent,
    GradesTableComponent,
    LectureListComponent,
    MensaMealComponent,
    NewsArticleComponent,
    EventViewComponent,
    BookLocationComponent,
    CampusMapFeatureModalComponent,
    CourseDataComponent
  ],
  entryComponents: [CampusMapFeatureModalComponent]
})
export class ComponentsModule { }
