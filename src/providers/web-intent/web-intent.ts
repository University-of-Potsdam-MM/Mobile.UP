import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser';
import { Storage } from '@ionic/storage';
import { IModule, IConfig } from '../../library/interfaces';
import { Platform, AlertController } from 'ionic-angular';
import { AppAvailability } from '@ionic-native/app-availability';
import { SafariViewController } from '@ionic-native/safari-view-controller';
import { TranslateService } from "@ngx-translate/core";

/**
 * @class WebIntentProvider
 * @classdesc Provider to handle webIntents
 */
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


  /**
   * @constructor
   * @param {InAppBrowser} theInAppBrowser
   * @param {HttpClient} http
   * @param {Storage} storage
   * @param {Platform} platform
   * @param {AppAvailability} appAvailability
   * @param {SafariViewController} safari
   * @param {AlertController} alertCtrl
   * @param {TranslateService} translate
   */
  constructor(
    private theInAppBrowser: InAppBrowser,
    public http: HttpClient,
    private storage: Storage,
    private platform: Platform,
    private appAvailability: AppAvailability,
    private safari: SafariViewController,
    private alertCtrl: AlertController,
    private translate: TranslateService) {
  }

  /**
   * @name handleWebIntentForModule
   * @description handles the webIntent for a page component and opens a webpage or the installed app
   * @param {string} moduleName - moduleName which is to be opened
   */
  public handleWebIntentForModule(moduleName:string) {
    this.storage.get("config").then((config:IConfig) => {
      var moduleConfig:IModule = config.modules[moduleName];

      // ask for permission to open Module externaly
      let alert = this.alertCtrl.create({
        title: this.translate.instant("alert.title.redirect"),
        message: this.translate.instant("alert.redirect"),
        buttons: [
          {
            text: this.translate.instant("button.continue"),
            handler: () => {
              if (moduleConfig) {
                if (this.platform.is("cordova")) {
                  if (moduleConfig.appId) {
                    var androidUrl, iosUrl, bundle;
                    androidUrl = moduleConfig.urlAndroid;
                    iosUrl = moduleConfig.urlIOS;
                    bundle = moduleConfig.bundleName;
                    this.launchExternalApp(moduleConfig.appId, bundle, androidUrl, iosUrl);
                  } else {
                    this.safari.isAvailable().then((available:boolean) => {
                      if (available) {
                        this.openWithSafari(moduleConfig.url);
                      } else { this.openWithInAppBrowser(moduleConfig.url); }
                    });
                  }
                } else {
                  this.openWithInAppBrowser(moduleConfig.url);
                }
              }
            }
          },
          {
            text: this.translate.instant("button.cancel"),
            role: 'cancel',
            handler: () => {
            }
          }
        ]
      });
      alert.present();
    });
  }

  /**
   * @name openWebsite
   * @description opens a url depending on the platform
   * @param {string} url
   */
  public handleWebIntentForWebsite(url: string){
    if (this.platform.is("cordova")) {
      this.safari.isAvailable().then((available:boolean) => {
        if (available) {
          this.openWithSafari(url);
        } else {
          this.openWithInAppBrowser(url); }
      });
    } else {
      this.openWithInAppBrowser(url);
    }
  }

  /**
   * @name openWithInAppBrowser
   * @description opens a url with the InAppBrowser
   * @param {string} url
   */
  openWithInAppBrowser(url: string) {
      let target = "_blank";
      this.theInAppBrowser.create(url,target,this.options);
  }

  /**
   * @name openWithSafari
   * @description opens a url with safari
   * @param {string} url
   */
  openWithSafari(url: string) {
    this.safari.show({
      url: url
    }).subscribe(result => {console.log(result);}, error => { console.log(error); })
  }

  /**
   * @name launchExternalApp
   * @description launches an external app with the help the plugin AppAvailability
   * @param {string} schemaName
   * @param {string} packageName
   * @param {string} androidUrl
   * @param {string} iosUrl
   */
  launchExternalApp(schemaName:string, packageName: string, androidUrl: string, iosUrl: string) {
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