import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpLoaderFactory } from 'src/app/app.module';
import { ComponentsModule } from 'src/app/components/components.module';
import { LoginModule } from '../login/login.import';
import { GradesPageRoutingModule } from './grades-routing.module';
import { GradesPage } from './grades.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GradesPageRoutingModule,
    ComponentsModule,
    LoginModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  declarations: [GradesPage],
})
export class GradesPageModule {}
