import { Injectable, OnInit } from '@angular/core';
import { InAppBrowser, InAppBrowserOptions } from '@ionic-native/in-app-browser/ngx';
import { IModule, ISetting } from '../../lib/interfaces';
import { TranslateService } from '@ngx-translate/core';
import { Platform, AlertController } from '@ionic/angular';
import { AppAvailability } from '@ionic-native/app-availability/ngx';
import { SafariViewController } from '@ionic-native/safari-view-controller/ngx';
import { UserSessionService } from '../user-session/user-session.service';
import { ConfigService } from '../config/config.service';
import { ISession } from '../login-provider/interfaces';
import { SettingsService } from '../settings/settings.service';
import { Logger, LoggingService } from 'ionic-logging-service';
import { utils } from 'src/app/lib/util';
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
    private safari: SafariViewController,
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
      if (this.platform.is('cordova') && moduleConfig.urlIOS && moduleConfig.urlAndroid) {

        if (moduleConfig.appId) {
          const setPreference = await this.storage.get('setExternalAppPreference');

          if (setPreference === null) {
            this.alertAppPreferences(moduleConfig);
            return;
          }

          const showDialog = await this.settingsProvider.getSettingValue('showDialog');
          const appRedirectArray = await this.settingsProvider.getSettingValue('appRedirect');
          const moduleName = this.translate.instant('page.' + moduleConfig.componentName + '.title');
          let appRedirect = false;

          if (
            appRedirectArray
            && Array.isArray(appRedirectArray)
            && utils.isInArray(appRedirectArray, moduleName)
          ) { appRedirect = true; }

          if (showDialog) {
            if (appRedirect) {
              const alert = await this.alertCtrl.create({
                header: this.translate.instant('alert.title.redirect'),
                message: this.translate.instant('alert.redirect-website-app'),
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
    const mailAutoLogin = await this.settingsProvider.getSettingValue('autologin');
    this.session = await this.userSession.getSession();

    if (this.platform.is('cordova')
      && mailAutoLogin
      && url === ConfigService.config.modules.mail.url
      && this.session && this.session.credentials
      && this.session.credentials.username
      && this.session.credentials.password) {
        this.openWithInAppBrowser(url, true);
    } else if (this.platform.is('cordova')) {
      this.safari.isAvailable().then((available: boolean) => {
        if (available) {
          this.openWithSafari(url);
        } else { this.openWithInAppBrowser(url, false); }
      });
    } else { this.openWithInAppBrowser(url, false); }
  }

  /**
   * @name openWithInAppBrowser
   * @description opens a url with the InAppBrowser
   * @param {string} url
   */
  private openWithInAppBrowser(url: string, mailLogin: boolean) {
    if (mailLogin && this.platform.is('cordova')) {
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
  private mailLogin(url: string) {
    const browser = this.inAppBrowser.create(url, '_blank', this.options);

    if (this.session && this.session.credentials && this.session.credentials.username && this.session.credentials.password) {
      this.logger.debug('mailLogin', 'trying to login...');
      const enterCredentials =
      `$('input.uname').val(\'${this.session.credentials.username}\');
      $('input.pewe').val(\'${this.session.credentials.password}\');
      $('button.loginbutton').click();`;

      browser.on('loadstop').subscribe(() => {
        browser.executeScript({ code: enterCredentials }).then(() => {
          this.logger.debug('mailLogin', 'successfully entered login data...');
        }, error => {
          this.logger.error('mailLogin', 'error injecting credentials', error);
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
    }).subscribe(result => { this.logger.debug('openWithSafari', result); }, error => { this.logger.error('openWithSafari', error); });
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
          name: 'Moodle.UP',
          type: 'checkbox',
          label: 'Moodle.UP',
          value: 'Moodle.UP',
          checked: false
        },
        {
          name: 'Reflect.UP',
          type: 'checkbox',
          label: 'Reflect.UP',
          value: 'Reflect.UP',
          checked: false
        }
      ],
      buttons: [
        {
          text: this.translate.instant('button.save'),
          handler: () => { this.storage.set('setExternalAppPreference', true); }
        }
      ]
    });

    await alert.present();
    const result = await alert.onWillDismiss();

    let value = [];
    if (result && result.data && result.data.values) {
      value = result.data.values;
    }

    const settings: ISetting[] = Constants.SETTINGS;
    let setting: ISetting;
    for (let i = 0; i < settings.length; i++) {
      if (settings[i].key === 'appRedirect') {
        setting = settings[i];
      }
    }

    setting.value = value;
    this.logger.debug('saveSettings', 'saved setting', setting, value);
    this.storage.set('settings.' + setting.key, setting).then(() => {
      this.handleWebIntentForModule(moduleConfig);
    });
  }

}
