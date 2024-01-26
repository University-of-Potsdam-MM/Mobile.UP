import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { IonicModule } from '@ionic/angular';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { GridsterModule } from 'angular-gridster2';
import { HttpLoaderFactory } from '../app.module';
import { BookListComponent } from './book-list/book-list.component';
import { BookLocationComponent } from './book-location/book-location.component';
import { CampusMapFeatureModalComponent } from './campus-map-feature-modal/campus-map-feature-modal.component';
import { CampusReorderModalPage } from './campus-tab/campus-reorder.modal';
import { CampusTabComponent } from './campus-tab/campus-tab.component';
import { CourseDataComponent } from './course-data/course-data.component';
import { CustomCardComponent } from './custom-card/custom-card.component';
import { DatePickerComponent } from './date-picker/date-picker.component';
import { EventViewComponent } from './event-view/event-view.component';
import { FooterDisclaimerComponent } from './footer-disclaimer/footer-disclaimer.component';
import { GradesTableComponent } from './grades-table/grades-table.component';
import { HintBoxComponent } from './hint-box/hint-box.component';
import { LectureListComponent } from './lecture-list/lecture-list.component';
import { MensaMealComponent } from './mensa-meal/mensa-meal.component';
import { ModulesGridComponent } from './modules-grid/modules-grid.component';
import { InfoBannerComponent } from './info-banner/info-banner.component';

@NgModule({
  declarations: [
    CustomCardComponent,
    HintBoxComponent,
    CampusTabComponent,
    BookListComponent,
    FooterDisclaimerComponent,
    GradesTableComponent,
    LectureListComponent,
    MensaMealComponent,
    EventViewComponent,
    BookLocationComponent,
    CampusMapFeatureModalComponent,
    CourseDataComponent,
    CampusReorderModalPage,
    DatePickerComponent,
    ModulesGridComponent,
    InfoBannerComponent,
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    LeafletModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    GridsterModule,
  ],
  exports: [
    CustomCardComponent,
    HintBoxComponent,
    CampusTabComponent,
    BookListComponent,
    FooterDisclaimerComponent,
    GradesTableComponent,
    LectureListComponent,
    MensaMealComponent,
    EventViewComponent,
    BookLocationComponent,
    CampusMapFeatureModalComponent,
    CourseDataComponent,
    DatePickerComponent,
    ModulesGridComponent,
    InfoBannerComponent,
  ],
})
export class ComponentsModule {}
