import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';
import { Storage } from '@ionic/storage';
import { IModule, IConfig } from '../../library/interfaces';
import { Platform } from 'ionic-angular';
import { AppAvailability } from '@ionic-native/app-availability';

@Injectable()
export class WebIntentProvider {

  options : InAppBrowserOptions = {
    location : 'yes',//Or 'no'
    hidden : 'no', //Or  'yes'
    clearcache : 'yes',
    clearsessioncache : 'yes',
    zoom : 'yes',//Android only ,shows browser zoom controls
    hardwareback : 'yes',
    mediaPlaybackRequiresUserAction : 'no',
    shouldPauseOnSuspend : 'no', //Android only
    closebuttoncaption : 'Close', //iOS only
    disallowoverscroll : 'no', //iOS only
    toolbar : 'yes', //iOS only
    enableViewportScale : 'no', //iOS only
    allowInlineMediaPlayback : 'no',//iOS only
    presentationstyle : 'pagesheet',//iOS only
    fullscreen : 'yes',//Windows only
  };

  constructor(
    private theInAppBrowser: InAppBrowser,
    public http: HttpClient,
    private storage: Storage,
    private platform: Platform,
    private appAvailability: AppAvailability) {

  }

  public handleWebIntent(moduleName:string) {
    this.storage.get("config").then((config:IConfig) => {
      var moduleConfig:IModule = config.modules[moduleName];
      if (moduleConfig) {
        if (this.platform.is("ios") || this.platform.is("android")) {
          if (moduleConfig.appId) {
            var androidUrl, iosUrl, bundle;
            androidUrl = moduleConfig.urlAndroid;
            iosUrl = moduleConfig.urlIOS;
            bundle = moduleConfig.bundleName;
            this.launchExternalApp(moduleConfig.appId, bundle, androidUrl, iosUrl);
          } else {
            this.openWithInAppBrowser(moduleConfig.url);
          }
        } else {
          this.openWithInAppBrowser(moduleConfig.url);
        }
      }
    });
  }

  openWithInAppBrowser(url:string){
      let target = "_blank";
      this.theInAppBrowser.create(url,target,this.options);
  }

  launchExternalApp(schemaName:string, packageName:string, androidUrl:string, iosUrl:string) {
    var app;
    if (this.platform.is("ios")) {
      app = schemaName;
    } else { app = packageName; }

    this.appAvailability.check(app).then(
      () => { // app installed
        this.theInAppBrowser.create(schemaName, '_system');
      },
      () => { // app not installed
        if (this.platform.is("ios")) {
          this.theInAppBrowser.create(iosUrl, '_system');
        } else { this.theInAppBrowser.create(androidUrl, '_system'); }
      }
    );

  }

}
