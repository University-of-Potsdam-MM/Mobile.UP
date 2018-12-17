import { ComponentsModule } from './../components/components.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler, APP_INITIALIZER} from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler, DeepLinkConfig  } from 'ionic-angular';
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
import { OrderModule } from 'ngx-order-pipe';
import { NgCalendarModule } from "ionic2-calendar";
import { Device } from '@ionic-native/device';
import { AppVersion } from '@ionic-native/app-version';
import { PulsProvider } from '../providers/puls/puls';
import { ConnectionProvider } from '../providers/connection/connection';
import { Network } from "@ionic-native/network";

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
import { WebIntentProvider } from '../providers/web-intent/web-intent';
import { LibraryPage } from '../pages/library/library';
import { BookDetailViewPage } from '../pages/book-detail-view/book-detail-view';
import { GradesPage } from '../pages/grades/grades';
import { LecturesPage } from '../pages/lectures/lectures';
import { LegalNoticePage } from '../pages/legal-notice/legal-notice';
import { PrivacyPolicyPage } from '../pages/privacy-policy/privacy-policy';
import { TermsOfUsePage } from '../pages/terms-of-use/terms-of-use';
import { ConfigProvider } from '../providers/config/config';
import { EventModal, TimetablePage } from "../pages/timetable/timetable";
import { PopoverComponent } from "../components/popover/popover";
import { OpeningHoursPage } from '../pages/opening-hours/opening-hours';
import { DetailedOpeningPage } from '../pages/detailed-opening/detailed-opening';
import { PopoverButton } from "../components/popover/popover-button";

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, "./assets/i18n/", ".json");
}

export function initConfig(config:ConfigProvider) {
  return () => config.load('assets/config.json');
}

export const deepLinkConfig: DeepLinkConfig = {
  links: [
    { component: HomePage, name: 'HomePage', segment: 'home' },
    { component: LoginPage, name: 'LoginPage', segment: 'login' },
    { component: LogoutPage, name: 'LogoutPage', segment: 'logout' },
    { component: EventsPage, name: 'EventsPage', segment: 'events'},
    { component: ImpressumPage, name: 'ImpressumPage', segment: 'imprint' },
    { component: EmergencyPage, name: 'EmergencyPage', segment: 'emergency' },
    { component: PersonsPage, name: 'PersonsPage', segment: 'persons' },
    { component: MensaPage, name: 'MensaPage', segment: 'mensa' },
    { component: SettingsPage, name: 'SettingsPage', segment: 'settings' },
    { component: LibraryPage, name: 'LibraryPage', segment: 'library' },
    { component: PracticePage, name: 'PracticePage', segment: 'practice' },
    { component: NewsPage, name: 'NewsPage', segment: 'news' },
    { component: TimetablePage, name: 'TimetablePage', segment: 'timetable' },
    { component: GradesPage, name: 'GradesPage', segment: 'grades' },
    { component: RoomsPage, name: 'RoomsPage', segment: 'rooms' },
    { component: LecturesPage, name: 'LecturesPage', segment: 'lectures' },
    { component: RoomplanPage, name: 'RoomplanPage', segment: 'roomplan' },
    { component: OpeningHoursPage, name: 'OpeningHoursPage', segment: 'opening-hours' }
  ]
};

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
    LibraryPage,
    BookDetailViewPage,
    PracticePage,
    NewsPage,
    EventsPage,
    GradesPage,
    RoomsPage,
    LecturesPage,
    RoomplanPage,
    LegalNoticePage,
    PrivacyPolicyPage,
    TermsOfUsePage,
    TimetablePage,
    EventModal,
    OpeningHoursPage,
    DetailedOpeningPage,
    PopoverButton
  ],
  imports: [
    HttpClientModule,
    ComponentsModule,
    BrowserModule,
    CalendarModule,
    OrderModule,
    CacheModule.forRoot({ keyPrefix: 'myCache-' }),
    IonicModule.forRoot(
      MobileUPApp,
      {
        backButtonText: ' ',
        mode: 'md'
      },
      deepLinkConfig
    ),
    IonicStorageModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (HttpLoaderFactory),
        deps: [HttpClient]
      }
    }),
    NgCalendarModule
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
    LibraryPage,
    MensaPage,
    SettingsPage,
    BookDetailViewPage,
    PracticePage,
    NewsPage,
    EventsPage,
    GradesPage,
    RoomsPage,
    LecturesPage,
    RoomplanPage,
    LegalNoticePage,
    PrivacyPolicyPage,
    TermsOfUsePage,
    OpeningHoursPage,
    DetailedOpeningPage,
    TimetablePage,
    EventModal,
    PopoverComponent
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    UPLoginProvider,
    InAppBrowser,
    SettingsProvider,
    Keyboard,
    SafariViewController,
    AppAvailability,
    WebIntentProvider,
    AppVersion,
    Device,
    ConfigProvider,
    {
      provide: APP_INITIALIZER,
      useFactory: initConfig,
      deps: [ConfigProvider],
      multi: true
    },
    PulsProvider,
    Network,
    ConnectionProvider
  ]
})
export class AppModule {
}
