import { registerLocaleData } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import localeDe from '@angular/common/locales/de';
import localeEn from '@angular/common/locales/en';
import { APP_INITIALIZER, Injectable, NgModule } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { Calendar } from '@awesome-cordova-plugins/calendar/ngx';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
// import { LoggingService } from 'ionic-logging-service';
import { GridsterModule } from 'angular-gridster2';
import { CacheModule } from 'ionic-cache';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthenticationGuardService } from './services/authentication-guard/authentication-guard.service';
import { ConfigService } from './services/config/config.service';
import { UPLoginProvider } from './services/login-service/login';
import { WebserviceWrapperService } from './services/webservice-wrapper/webservice-wrapper.service';
registerLocaleData(localeDe);
registerLocaleData(localeEn);

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
