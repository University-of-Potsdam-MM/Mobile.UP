import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MobileUPApp } from './app.component';


import { HttpClientModule } from '@angular/common/http';

import { HomePage } from '../pages/home/home';
import { ImpressumPage } from '../pages/impressum/impressum';
import { PersonsPage } from '../pages/persons/persons';
import { EmergencyPage } from '../pages/emergency/emergency';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AuthServiceProvider } from '../providers/auth-service/auth-service';


@NgModule({
  declarations: [
    MobileUPApp,
    HomePage,
    ImpressumPage,
    EmergencyPage,
    PersonsPage
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    IonicModule.forRoot(MobileUPApp),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MobileUPApp,
    HomePage,
    ImpressumPage,
    EmergencyPage,
    PersonsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    AuthServiceProvider
  ]
})
export class AppModule {}
