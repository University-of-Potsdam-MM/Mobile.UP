import { Injectable, OnInit } from '@angular/core';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser/ngx';
import { IModule, ISetting } from '../../lib/interfaces';
import { TranslateService } from '@ngx-translate/core';
import { Platform, AlertController } from '@ionic/angular';
import { AppAvailability } from '@ionic-native/app-availability/ngx';
import { SafariViewController } from '@ionic-native/safari-view-controller/ngx';
import { UserSessionService } from '../user-session/user-session.service';
import { ISession } from '../login-provider/interfaces';
import { SettingsService } from '../settings/settings.service';
import { Logger, LoggingService } from 'ionic-logging-service';
import { Storage } from '@ionic/storage';
import * as Constants from '../../services/settings/settings_config';

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
    hardwareback : 'yes',
    usewkwebview: 'yes',
    hidenavigationbuttons: 'no',
    mediaPlaybackRequiresUserAction : 'yes',
    shouldPauseOnSuspend : 'no',
    closebuttoncaption : 'Fertig',
    disallowoverscroll : 'no',
    toolbar : 'yes',
    toolbarposition: 'bottom',
    enableViewportScale : 'yes',
    allowInlineMediaPlayback : 'no',
  };

  session: ISession;
  logger: Logger;

  constructor(
    private inAppBrowser: InAppBrowser,
    private translate: TranslateService,
    private platform: Platform,
    private userSession: UserSessionService,
    private settingsProvider: SettingsService,
    private appAvailability: AppAvailability,
    private safariOrChrome: SafariViewController,
    private alertCtrl: AlertController,
    private storage: Storage,
    private loggingService: LoggingService
  ) {
    this.logger = this.loggingService.getLogger('[/web-intent-service]');
  }

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
    const showDialog = await this.settingsProvider.getSettingValue('showDialog');

    if (showDialog) {
      // ask for permission to open Module externaly
      const alert = await this.alertCtrl.create({
        header: this.translate.instant('alert.redirect-website'),
        backdropDismiss: false,
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
      await alert.present();
    } else { this.handleWebIntentForWebsite(url); }
  }

  /**
   * @name handleWebIntentForModule
   * @description handles the webIntent for a page component and opens a webpage or the installed app
   * @param {string} moduleName - moduleName which is to be opened
   */
  async handleWebIntentForModule(moduleConfig: IModule) {
    if (moduleConfig) {
      if (
        this.platform.is('cordova') && (this.platform.is('ios') || this.platform.is('android')) &&
        moduleConfig.urlIOS && moduleConfig.urlAndroid
      ) {

        if (moduleConfig.appId) {
          const setPreference = await this.storage.get('setUserPreferenceWebsiteOrApp');

          if (setPreference === null) {
            this.alertAppPreferences(moduleConfig);
            return;
          }

          const showDialog = await this.settingsProvider.getSettingValue('showDialog');
          const userPreferenceWebsiteOrApp = await this.settingsProvider.getSettingValue('appRedirect');

          let appRedirect = false;
          if (userPreferenceWebsiteOrApp == 'App') { appRedirect = true; }

          if (showDialog) {
            if (appRedirect) {
              const alert = await this.alertCtrl.create({
                header: this.translate.instant('alert.redirect-website-app'),
                backdropDismiss: false,
                buttons: [
                  {
                    text: this.translate.instant('button.cancel'),
                    role: 'cancel',
                    handler: () => {}
                  },
                  {
                    text: this.translate.instant('button.ok'),
                    handler: () => {
                      this.launchExternalApp(moduleConfig.appId, moduleConfig.bundleName, moduleConfig.urlAndroid, moduleConfig.urlIOS);
                    }
                  }
                ]
              });
              await alert.present();
            } else {
              this.permissionPromptWebsite(moduleConfig.url);
            }
          } else {
            if (appRedirect) {
              this.launchExternalApp(moduleConfig.appId, moduleConfig.bundleName, moduleConfig.urlAndroid, moduleConfig.urlIOS);
            } else { this.handleWebIntentForWebsite(moduleConfig.url); }
          }
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
  private async handleWebIntentForWebsite(url: string) {
    this.session = await this.userSession.getSession();

    if (this.platform.is('cordova')) {
      this.safariOrChrome.isAvailable().then((available: boolean) => {
        if (available) {
          this.openWithSafariOrChrome(url);
        } else { this.openWithInAppBrowser(url); }
      });
    } else { this.openWithInAppBrowser(url); }
  }

  /**
   * @name openWithInAppBrowser
   * @description opens a url with the InAppBrowser
   * @param {string} url
   */
  private openWithInAppBrowser(url: string) {
    const target = '_blank';
    this.inAppBrowser.create(url, target, this.options);
  }

  /** DISABLED because InAppBrowser-Plugin causes multiple problems, f.e.
   * - not being able to write an email
   * - not being able to open attachements
   * - layout issues with newer devices (like iPhone X)
   * - Mail.UP 'not supported' warning on iOS
   *
   * alternative browsers do not support script injection for security reasons
   *
   * @name mailLogin
   * @description opens mail in browser and injects credentials
   */
  // private mailLogin(url: string) {
  //   const browser = this.inAppBrowser.create(url, '_blank', this.options);

  //   if (this.session && this.session.credentials && this.session.credentials.username && this.session.credentials.password) {
  //     this.logger.debug('mailLogin', 'trying to login...');
  //     const enterCredentials =
  //     `$('input.uname').val(\'${this.session.credentials.username}\');
  //     $('input.pewe').val(\'${this.session.credentials.password}\');
  //     $('button.loginbutton').click();`;

  //     browser.on('loadstop').subscribe(() => {
  //       browser.executeScript({ code: enterCredentials }).then(() => {
  //         this.logger.debug('mailLogin', 'successfully entered login data...');
  //       }, error => {
  //         this.logger.error('mailLogin', 'error injecting credentials', error);
  //       });
  //     });
  //   }
  // }

  /**
   * @name openWithSafariOrChrome
   * @description opens a url with safari or chrome custom tabs
   * @param {string} url
   */
  private openWithSafariOrChrome(url: string) {
    this.safariOrChrome.show({
      url: url
    }).subscribe(
      result => { this.logger.debug('openWithSafariOrChrome', result); },
      error => { this.logger.error('openWithSafariOrChrome', error); }
    );
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

  async alertAppPreferences(moduleConfig: IModule) {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('page.settings.setting.appRedirect.lbl'),
      message: this.translate.instant('alert.redirect-first-start'),
      backdropDismiss: false,
      inputs: [
        {
          name: 'Website',
          type: 'radio',
          label: 'Website',
          value: 'Website',
          checked: true
        },
        {
          name: 'App',
          type: 'radio',
          label: 'App',
          value: 'App',
          checked: false
        }
      ],
      buttons: [
        {
          text: this.translate.instant('button.cancel'),
          role: 'cancel',
          handler: () => {
            return;
          }
        },
        {
          text: this.translate.instant('button.save'),
          handler: (decision) => {
            this.storage.set('setUserPreferenceWebsiteOrApp', true);

            const settings: ISetting[] = Constants.SETTINGS;
            let setting: ISetting;
            for (let i = 0; i < settings.length; i++) {
              if (settings[i].key === 'appRedirect') {
                setting = settings[i];
              }
            }

            setting.value = decision;
            this.logger.debug('saveSettings', 'saved setting', setting, decision);
            this.storage.set('settings.' + setting.key, setting).then(() => {
              this.handleWebIntentForModule(moduleConfig);
            });
          }
        }
      ]
    });
    alert.present();
  }

}
