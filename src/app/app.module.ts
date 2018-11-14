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
import { SafariViewController } from '@ionic-native/safari-view-controller';
import { Keyboard } from '@ionic-native/keyboard';
import { AppAvailability } from '@ionic-native/app-availability';
import { CalendarModule } from "ion2-calendar";
import { CacheModule } from "ionic-cache";

/* Pages */
import { HomePage } from '../pages/home/home';
import { ImpressumPage } from '../pages/impressum/impressum';
import { LoginPage } from "../pages/login/login";
import { LogoutPage } from "../pages/logout/logout";
import { PracticePage } from "../pages/practice/practice";
import { PersonsPage } from "../pages/persons/persons";
import { MensaPage } from "../pages/mensa/mensa";
import { NewsPage } from './../pages/news/news';
import { EventsPage } from './../pages/events/events';
import { RoomsPage } from "../pages/rooms/rooms";
import { RoomplanPage } from "../pages/roomplan/roomplan";
import { SettingsPage } from "../pages/settings/settings";
import { SettingsProvider } from '../providers/settings/settings';
import { ComponentsProvider } from '../providers/components/components';
import { WebIntentProvider } from '../providers/web-intent/web-intent';
import { GradesPage } from '../pages/grades/grades';
import { LecturesPage } from '../pages/lectures/lectures';

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
    MensaPage,
    SettingsPage,
    PracticePage,
    NewsPage,
    EventsPage,
    GradesPage,
    RoomsPage,
    LecturesPage,
    RoomplanPage
  ],
  imports: [
    HttpClientModule,
    ComponentsModule,
    BrowserModule,
    CalendarModule,
    CacheModule.forRoot({ keyPrefix: 'myCache-' }),
    IonicModule.forRoot(MobileUPApp, {
      backButtonText: ' ',
    }),
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
    MensaPage,
    SettingsPage,
    PracticePage,
    NewsPage,
    EventsPage,
    GradesPage,
    RoomsPage,
    LecturesPage,
    RoomplanPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    UPLoginProvider,
    InAppBrowser,
    SettingsProvider,
    Keyboard,
    ComponentsProvider,
    SafariViewController,
    AppAvailability,
    WebIntentProvider
  ]
})
export class AppModule {
}
