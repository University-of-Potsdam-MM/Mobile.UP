import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { GradesPageRoutingModule } from './grades-routing.module';
import { GradesPage } from './grades.page';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { ComponentsModule } from 'src/app/components/components.module';
import { HttpLoaderFactory } from 'src/app/app.module';
import { LoginModule } from '../login/login.import';

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
