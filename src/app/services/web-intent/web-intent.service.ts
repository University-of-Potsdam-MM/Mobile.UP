import { Injectable, OnInit } from '@angular/core';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser/ngx';
import { IModule } from '../../lib/interfaces';
import { TranslateService } from '@ngx-translate/core';
import { Platform, AlertController } from '@ionic/angular';
import { AppAvailability } from '@ionic-native/app-availability/ngx';
import { SafariViewController } from '@ionic-native/safari-view-controller/ngx';
import { UserSessionService } from '../user-session/user-session.service';
import { ConfigService } from '../config/config.service';
import { ISession } from '../login-provider/interfaces';

@Injectable({
  providedIn: 'root'
})
export class WebIntentService implements OnInit {

  options: InAppBrowserOptions = {
    location : 'no',
    hidden : 'no',
    clearcache : 'yes',
    clearsessioncache : 'yes',
    zoom : 'no',
    hardwareback : 'no',
    usewkwebview: 'yes',
    hidenavigationbuttons: 'yes',
    mediaPlaybackRequiresUserAction : 'yes',
    shouldPauseOnSuspend : 'no',
    closebuttoncaption : 'Fertig',
    disallowoverscroll : 'no',
    toolbar : 'yes',
    toolbarposition: 'bottom',
    enableViewportScale : 'yes',
    allowInlineMediaPlayback : 'no',
  };

  constructor(
    private inAppBrowser: InAppBrowser,
    private translate: TranslateService,
    private platform: Platform,
    private alertCtrl: AlertController,
    private userSession: UserSessionService,
    private appAvailability: AppAvailability,
    private safari: SafariViewController
    ) { }

  ngOnInit() {
    if (this.translate.currentLang === 'en') {
      this.options.closebuttoncaption = 'Close';
    }
  }

  /**
   * @name permissionPromptWebsite
   * @description asks for permission for a website to be opened externaly
   * @param {IModule} moduleConfig - mmoduleConfig
   */
  async permissionPromptWebsite(url: string) {
    // ask for permission to open Module externaly
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('alert.title.redirect'),
      message: this.translate.instant('alert.redirect-website'),
      buttons: [
        {
          text: this.translate.instant('button.cancel'),
          role: 'cancel',
          handler: () => {}
        },
        {
          text: this.translate.instant('button.ok'),
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
  async handleWebIntentForModule(moduleName: string) {
    const moduleConfig: IModule = ConfigService.config.modules[moduleName];

    if (moduleConfig) {
      // in app context therefore display three buttons
      if (this.platform.is('cordova') && moduleConfig.urlIOS && moduleConfig.urlAndroid) {

        if (moduleConfig.appId) {
          // ask for permission to open Module externaly with three options
          const alert = await this.alertCtrl.create({
            header: this.translate.instant('alert.title.redirect'),
            message: this.translate.instant('alert.redirect-website-app'),
            buttons: [
              {
                text: this.translate.instant('button.app'),
                handler: () => {
                    const androidUrl = moduleConfig.urlAndroid;
                    const iosUrl = moduleConfig.urlIOS;
                    const bundle = moduleConfig.bundleName;
                    this.launchExternalApp(moduleConfig.appId, bundle, androidUrl, iosUrl);
                }
              },
              {
                text: this.translate.instant('button.webpage'),
                handler: () => {
                  this.handleWebIntentForWebsite(moduleConfig.url);
                }
              },
              {
                text: this.translate.instant('button.cancel'),
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
  }

  /**
   * @name openWebsite
   * @description opens a url depending on the platform
   * @param {string} url
   */
  private handleWebIntentForWebsite(url: string) {
    if (this.platform.is('cordova') && url !== ConfigService.config.modules.mail.url) {
      this.safari.isAvailable().then((available: boolean) => {
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
  private openWithInAppBrowser(url: string) {
    if (url === ConfigService.config.modules.mail.url && this.platform.is('cordova')) {
      this.mailLogin(url);
    } else {
      const target = '_blank';
      this.inAppBrowser.create(url, target, this.options);
    }
  }

  /**
   * @name mailLogin
   * @description opens mail in browser and injects credentials
   */
  private async mailLogin(url: string) {
    const session: ISession = await this.userSession.getSession();
    const browser = this.inAppBrowser.create(url, '_blank', this.options);

    if (session && session.credentials && session.credentials.username && session.credentials.password) {
      console.log('[Mail] trying to login...');

      const enterCredentials =
        `$('input.uname').val(\'${session.credentials.username}\');
        $('input.pewe').val(\'${session.credentials.password}\');
        $('button.loginbutton').click();`;

      browser.on('loadstop').subscribe(() => {
        browser.executeScript({ code: enterCredentials }).then(() => {
          console.log('successfully entered login data...');
        }, error => {
          console.log('ERROR injecting login data...');
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
  private openWithSafari(url: string) {
    this.safari.show({
      url: url
    }).subscribe(result => {console.log(result); }, error => { console.log(error); });
  }

  /**
   * @name launchExternalApp
   * @description launches an external app with the help the plugin AppAvailability
   * @param {string} schemaName
   * @param {string} packageName
   * @param {string} androidUrl
   * @param {string} iosUrl
   */
  private launchExternalApp(schemaName: string, packageName: string, androidUrl: string, iosUrl: string) {
    let app;
    if (this.platform.is('ios')) {
      app = schemaName;
    } else { app = packageName; }

    this.appAvailability.check(app).then(
      () => { // app installed
        this.inAppBrowser.create(schemaName, '_system');
      },
      () => { // app not installed
        if (this.platform.is('ios')) {
          this.inAppBrowser.create(iosUrl, '_system');
        } else { this.inAppBrowser.create(androidUrl, '_system'); }
      }
    );
  }
}
