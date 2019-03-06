import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TimetablePage } from './timetable.page';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { NgCalendarModule  } from 'ionic2-calendar';
import { EventModalPage } from './event.modal';
import { LoginModule } from '../login/login.import';
import { ComponentsModule } from 'src/app/components/components.module';
import { HttpLoaderFactory } from 'src/app/app.module';

const routes: Routes = [
  {
    path: '',
    component: TimetablePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoginModule,
    ComponentsModule,
    NgCalendarModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (HttpLoaderFactory),
        deps: [HttpClient]
      }
    }),
    RouterModule.forChild(routes)
  ],
  declarations: [
    TimetablePage,
    EventModalPage
  ],
  entryComponents: [
    EventModalPage
  ]
})
export class TimetablePageModule {}
