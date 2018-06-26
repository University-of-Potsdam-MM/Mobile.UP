import { TabsPage } from './../pages/tabs/tabs';

import { ComponentsModule } from './../components/components.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MobileUPApp } from './app.component';
import { UPLoginProvider } from "../providers/login-provider/login";
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { EmergencyPage } from '../pages/emergency/emergency';
import { InAppBrowser } from "@ionic-native/in-app-browser";
import { IonicStorageModule } from "@ionic/storage";

/* Pages */
import { HomePage } from '../pages/home/home';
import { ImpressumPage } from '../pages/impressum/impressum';
import { LoginPage } from "../pages/login/login";
import { LogoutPage } from "../pages/logout/logout";
import { PersonsPage } from "../pages/persons/persons";
import { NewsPage } from './../pages/news/news';
import { EventsPage } from './../pages/events/events';
import { RoomsPage } from "../pages/rooms/rooms";
import { RoomplanPage } from "../pages/roomplan/roomplan";

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

@NgModule({
  declarations: [
    MobileUPApp,
    HomePage,
    LoginPage,
    LogoutPage,
    ImpressumPage,
    EmergencyPage,
    PersonsPage,
    NewsPage,
    EventsPage,
    RoomsPage,
    RoomplanPage,
    TabsPage
  ],
  imports: [
    HttpClientModule,
    ComponentsModule,
    BrowserModule,
    IonicModule.forRoot(MobileUPApp),
    IonicStorageModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (HttpLoaderFactory),
        deps: [HttpClient]
      }
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MobileUPApp,
    HomePage,
    LoginPage,
    LogoutPage,
    ImpressumPage,
    EmergencyPage,
    PersonsPage,
    NewsPage,
    EventsPage,
    RoomsPage,
    RoomplanPage,
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    UPLoginProvider,
    InAppBrowser
  ]
})
export class AppModule {}
