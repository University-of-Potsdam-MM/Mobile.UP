import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';
import { Storage } from '@ionic/storage';
import { IModule, IConfig } from '../../library/interfaces';
import { Platform } from 'ionic-angular';

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

  constructor(private theInAppBrowser: InAppBrowser, public http: HttpClient, private storage: Storage, private platform: Platform) {

  }

  public handleWebIntent(moduleName:string) {
    this.storage.get("config").then((config:IConfig) => {
      var appUrls = config.appUrls;
      var moduleConfig:IModule = config.modules[moduleName];
      if (moduleConfig) {
        if (this.platform.is("ios") || this.platform.is("android")) {
          if (moduleConfig.appId) {
            console.log(moduleConfig.appId);
            // TODO: App öffnen
          } else {
            this.openWithInAppBrowser(moduleConfig.url);
          }
        } else {
          this.openWithInAppBrowser(moduleConfig.url);
        }
      }
    });
  }

  openWithSystemBrowser(url : string){
    let target = "_system";
    this.theInAppBrowser.create(url,target,this.options);
  }

  openWithInAppBrowser(url : string){
      let target = "_blank";
      this.theInAppBrowser.create(url,target,this.options);
  }
  openWithCordovaBrowser(url : string){
      let target = "_self";
      this.theInAppBrowser.create(url,target,this.options);
  }

}
