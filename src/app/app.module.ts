import { NgModule, APP_INITIALIZER, Injectable } from '@angular/core';
import { BrowserModule, HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CacheModule } from 'ionic-cache';
import { Network } from '@ionic-native/network/ngx';
import { SafariViewController } from '@ionic-native/safari-view-controller/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { AppAvailability } from '@ionic-native/app-availability/ngx';
import { IonicStorageModule } from '@ionic/storage';
import { Device } from '@ionic-native/device/ngx';
import { LaunchNavigator } from '@ionic-native/launch-navigator/ngx';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { Contacts } from '@ionic-native/contacts/ngx';
import { CallNumber } from '@ionic-native/call-number/ngx';
import 'hammerjs';
import { ConfigService } from './services/config/config.service';
import localeDe from '@angular/common/locales/de';
import localeEn from '@angular/common/locales/en';
import { registerLocaleData } from '@angular/common';
import { UPLoginProvider } from './services/login-provider/login';
registerLocaleData(localeDe);
registerLocaleData(localeEn);
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { Calendar } from '@ionic-native/calendar/ngx';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { WebserviceWrapperService } from './services/webservice-wrapper/webservice-wrapper.service';
import { HTTP } from '@ionic-native/http/ngx';
import { LoggingService } from 'ionic-logging-service';
import { environment } from 'src/environments/environment';
import { File } from '@ionic-native/file/ngx';
import { EmailComposer } from '@ionic-native/email-composer/ngx';
import { GridsterModule } from 'angular-gridster2';

export function configureLogging(loggingService: LoggingService): () => void {
  return () => loggingService.configure(environment.logging);
}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

export function initConfig(config: ConfigService) {
  return () => config.load('assets/config.json');
}

export function initEmergency(config: ConfigService) {
  return () => config.loadEmergency('assets/json/emergency.json');
}

export function initApiManagerStatus(config: ConfigService) {
  return () => config.loadApiManagerStatus();
}

@Injectable({
  providedIn: 'root',
})
export class IonicGestureConfig extends HammerGestureConfig {
  buildHammer(element: HTMLElement) {
      const mc = new (<any> window).Hammer(element);

      for (const eventName in this.overrides) {
          if (mc && eventName) {
              mc.get(eventName).set(this.overrides[eventName]);
          }
      }

      return mc;
  }
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      backButtonIcon: 'chevron-back',
      backButtonText: '',
      mode: 'md',
      rippleEffect: true
    }),
    LeafletModule,
    IonicStorageModule.forRoot({
      driverOrder: ['indexeddb', 'sqlite', 'websql', 'localstorage']
    }),
    AppRoutingModule,
    HttpClientModule,
    CacheModule.forRoot({ keyPrefix: 'cache-' }),
    GridsterModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (HttpLoaderFactory),
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Network,
    Device,
    SafariViewController,
    InAppBrowser,
    Keyboard,
    // tslint:disable-next-line: deprecation
    Contacts,
    CallNumber,
    Geolocation,
    LaunchNavigator,
    AppAvailability,
    UPLoginProvider,
    ConfigService,
    Calendar,
    WebserviceWrapperService,
    HTTP,
    File,
    EmailComposer,
    {
      provide: APP_INITIALIZER,
      useFactory: initConfig,
      deps: [ConfigService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initEmergency,
      deps: [ConfigService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initApiManagerStatus,
      deps: [ConfigService],
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: configureLogging,
      deps: [LoggingService],
      multi: true
    },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HAMMER_GESTURE_CONFIG, useClass: IonicGestureConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
