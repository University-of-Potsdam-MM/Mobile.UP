import { NgModule, APP_INITIALIZER, Injectable } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ConfigService } from './services/config/config.service';
import localeDe from '@angular/common/locales/de';
import localeEn from '@angular/common/locales/en';
import { registerLocaleData } from '@angular/common';
import { UPLoginProvider } from './services/login-service/login';
registerLocaleData(localeDe);
registerLocaleData(localeEn);
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { WebserviceWrapperService } from './services/webservice-wrapper/webservice-wrapper.service';
// import { LoggingService } from 'ionic-logging-service';
import { GridsterModule } from 'angular-gridster2';
import { CacheModule } from 'ionic-cache';
import { IonicStorageModule } from '@ionic/storage';
import { FormBuilder } from '@angular/forms';
import { Calendar } from '@ionic-native/calendar/ngx';
import { AuthenticationGuardService } from './services/authentication-guard/authentication-guard.service';

// export function configureLogging(loggingService: LoggingService): () => void {
//   return () => loggingService.configure(environment.logging);
// }

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
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      backButtonIcon: 'chevron-back',
      backButtonText: '',
      mode: 'ios',
      rippleEffect: false,
    }),
    LeafletModule,
    AppRoutingModule,
    HttpClientModule,
    GridsterModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    CacheModule.forRoot({ keyPrefix: 'cache-' }),
    IonicStorageModule.forRoot(),
  ],
  providers: [
    UPLoginProvider,
    ConfigService,
    Calendar,
    WebserviceWrapperService,
    AuthenticationGuardService,
    FormBuilder,
    {
      provide: APP_INITIALIZER,
      useFactory: initConfig,
      deps: [ConfigService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initEmergency,
      deps: [ConfigService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initApiManagerStatus,
      deps: [ConfigService],
      multi: true,
    },
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: configureLogging,
    //   deps: [LoggingService],
    //   multi: true,
    // },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
