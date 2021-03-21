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
import { EventViewComponent } from './event-view/event-view.component';
import { FormsModule } from '@angular/forms';
import { BookLocationComponent } from './book-location/book-location.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { CampusMapFeatureModalComponent } from './campus-map-feature-modal/campus-map-feature-modal.component';
import { CourseDataComponent } from './course-data/course-data.component';
import { CampusReorderModalPage } from './campus-tab/campus-reorder.modal';
import { DatePickerComponent } from './date-picker/date-picker.component';
import { ModulesGridComponent } from './modules-grid/modules-grid.component';
import { GridsterModule } from 'angular-gridster2';
import { NetworkErrorHintComponent } from './network-error-hint/network-error-hint.component';
import { CustomCardComponent } from './custom-card/custom-card.component';

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
    NetworkErrorHintComponent,
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
    NetworkErrorHintComponent,
  ],
})
export class ComponentsModule {}
