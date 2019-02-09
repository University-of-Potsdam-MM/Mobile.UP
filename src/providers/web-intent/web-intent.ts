import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser/ngx';
import { Storage } from '@ionic/storage';
import { IModule, IConfig } from '../../library/interfaces';
import { Platform, AlertController } from 'ionic-angular';
import { AppAvailability } from '@ionic-native/app-availability/ngx';
import { SafariViewController } from '@ionic-native/safari-view-controller/ngx';
import { TranslateService } from "@ngx-translate/core";
import { SessionProvider } from '../session/session';

/**
 * @class WebIntentProvider
 * @classdesc Provider to handle webIntents
 */
@Injectable()
export class WebIntentProvider {

  options : InAppBrowserOptions = {
    location : 'no',//Or 'no'
    hidden : 'no', //Or  'yes'
    clearcache : 'yes',
    clearsessioncache : 'yes',
    zoom : 'no',//Android only ,shows browser zoom controls
    hardwareback : 'no',
    usewkwebview: 'yes',
    hidenavigationbuttons: 'yes',
    mediaPlaybackRequiresUserAction : 'yes',
    shouldPauseOnSuspend : 'no', //Android only
    closebuttoncaption : 'Fertig', //iOS only
    disallowoverscroll : 'no', //iOS only
    toolbar : 'yes', //iOS only,
    toolbarposition: 'bottom',
    enableViewportScale : 'yes', //iOS only
    allowInlineMediaPlayback : 'no',//iOS only
  };

  config: IConfig;

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
    private sessionProvider: SessionProvider,
    private safari: SafariViewController,
    private alertCtrl: AlertController,
    private translate: TranslateService) {
  }

  async ngOnInit() {
    if (this.translate.currentLang == "en") {
      this.options.closebuttoncaption = "Close";
    }

    this.config = await this.storage.get("config");
  }

  /**
   * @name permissionPromptWebsite
   * @description asks for permission for a website to be opened externaly
   * @param {IModule} moduleConfig - mmoduleConfig
   */
  public permissionPromptWebsite(url:string){
    // ask for permission to open Module externaly
    let alert = this.alertCtrl.create({
      title: this.translate.instant("alert.title.redirect"),
      message: this.translate.instant("alert.redirect-website"),
      buttons: [
        {
          text: this.translate.instant("button.cancel"),
          role: 'cancel',
          handler: () => {}
        },
        {
          text: this.translate.instant("button.ok"),
          handler: () => {
            this.handleWebIntentForWebsite(url);
          }
        }
      ]
    });
    alert.present();
  }

  /**
   * @name handleWebIntentForModule
   * @description handles the webIntent for a page component and opens a webpage or the installed app
   * @param {string} moduleName - moduleName which is to be opened
   */
  public handleWebIntentForModule(moduleName:string) {
    this.storage.get("config").then((config:IConfig) => {
      var moduleConfig:IModule = config.modules[moduleName];

      if (moduleConfig) {
        // in app context therefore display three buttons
        if (this.platform.is("cordova") && moduleConfig.urlIOS && moduleConfig.urlAndroid) {

          if (moduleConfig.appId) {
            // ask for permission to open Module externaly with three options
            let alert = this.alertCtrl.create({
              title: this.translate.instant("alert.title.redirect"),
              message: this.translate.instant("alert.redirect-website-app"),
              buttons: [
                {
                  text: this.translate.instant("button.app"),
                  handler: () => {
                      var androidUrl, iosUrl, bundle;
                      androidUrl = moduleConfig.urlAndroid;
                      iosUrl = moduleConfig.urlIOS;
                      bundle = moduleConfig.bundleName;
                      this.launchExternalApp(moduleConfig.appId, bundle, androidUrl, iosUrl);
                  }
                },
                {
                  text: this.translate.instant("button.webpage"),
                  handler: () => {
                    this.handleWebIntentForWebsite(moduleConfig.url);
                  }
                },
                {
                  text: this.translate.instant("button.cancel"),
                  role: 'cancel',
                  handler: () => {}
                }
              ]
            });
            alert.present();
          } else {
            this.permissionPromptWebsite(moduleConfig.url);
          }
        } else {
          this.permissionPromptWebsite(moduleConfig.url);
        }
      }
    });
  }

  /**
   * @name openWebsite
   * @description opens a url depending on the platform
   * @param {string} url
   */
  public async handleWebIntentForWebsite(url: string) {

    this.config = await this.storage.get("config");

    if (this.platform.is("cordova") && url != this.config.modules.mail.url) {
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
  async openWithInAppBrowser(url: string) {
    this.config = await this.storage.get("config");
    if (url != this.config.modules.mail.url) {
      let target = "_blank";
      this.theInAppBrowser.create(url,target,this.options);
    } else { this.mailLogin(url); }
  }

  /**
   * @name mailLogin
   * @description opens mail in browser and injects credentials
   */
  async mailLogin(url: string) {
    let tmp = await this.sessionProvider.getSession();
    var session = undefined;
    if (tmp) {
      if (typeof tmp !== 'object') {
        session = JSON.parse(tmp);
      } else { session = tmp; }
    }
    
    let browser = this.theInAppBrowser.create(url, "_blank", this.options);

    if (session && session.credentials && session.credentials.username && session.credentials.password) {
      console.log("[Mail] trying to login...")

      let enterCredentials =
        `$("input.uname").val(\'${session.credentials.username}\');
        $("input.pewe").val(\'${session.credentials.password}\');
        $("button.loginbutton").click();`;

      browser.on("loadstop").subscribe((event) => {
        browser.executeScript({ code: enterCredentials }).then(() => {
          console.log("successfully entered login data...");
        }, error => {
          console.log("ERROR injecting login data...");
          console.log(error);
        });
      });

    }
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