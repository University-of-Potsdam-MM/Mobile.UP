import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TimetablePageRoutingModule } from './timetable-routing.module';
import { TimetablePage } from './timetable.page';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { NgCalendarModule } from 'ionic2-calendar';
import { EventModalPage } from './event.modal';
import { LoginModule } from '../login/login.import';
import { ComponentsModule } from 'src/app/components/components.module';
import { HttpLoaderFactory } from 'src/app/app.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TimetablePageRoutingModule,
    LoginModule,
    ComponentsModule,
    NgCalendarModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  declarations: [TimetablePage, EventModalPage],
})
export class TimetablePageModule {}
