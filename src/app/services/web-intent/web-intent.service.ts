import { Injectable } from '@angular/core';
import { AppLauncher } from '@capacitor/app-launcher';
import { Browser } from '@capacitor/browser';
import { Preferences } from '@capacitor/preferences';
import { AlertController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { IModule, ISetting } from '../../lib/interfaces';
// import { Logger, LoggingService } from 'ionic-logging-service';
import * as Constants from '../../services/settings/settings_config';
import { SettingsService } from '../settings/settings.service';

@Injectable({
  providedIn: 'root',
})
export class WebIntentService {
  // logger: Logger;

  constructor(
    private translate: TranslateService,
    private platform: Platform,
    private settingsProvider: SettingsService,
    private alertCtrl: AlertController // private loggingService: LoggingService
  ) {
    // this.logger = this.loggingService.getLogger('[/web-intent-service]');
  }

  /**
   * @name permissionPromptWebsite
   * @description asks for permission for a website to be opened externaly
   * @param {IModule} moduleConfig - mmoduleConfig
   */
  async permissionPromptWebsite(url: string) {
    const showDialog = await this.settingsProvider.getSettingValue(
      'showDialog'
    );

    if (showDialog) {
      // ask for permission to open Module externaly
      const alert = await this.alertCtrl.create({
        header: this.translate.instant('alert.redirect-website'),
        backdropDismiss: false,
        mode: 'md',
        buttons: [
          {
            text: this.translate.instant('button.cancel'),
            role: 'cancel',
          },
          {
            text: this.translate.instant('button.ok'),
            handler: () => {
              this.openWebsite(url);
            },
          },
        ],
      });
      await alert.present();
    } else {
      this.openWebsite(url);
    }
  }

  /**
   * @name handleWebIntentForModule
   * @description handles the webIntent for a page component and opens a webpage or the installed app
   * @param {string} moduleName - moduleName which is to be opened
   */
  async handleWebIntentForModule(moduleConfig: IModule) {
    if (moduleConfig) {
      if (
        (this.platform.is('ios') || this.platform.is('android')) &&
        moduleConfig.urlIOS &&
        moduleConfig.urlAndroid
      ) {
        if (moduleConfig.appId) {
          const prefObj = await Preferences.get({
            key: 'setUserPreferenceWebsiteOrApp',
          });
          const setPreference = JSON.parse(prefObj.value);

          if (setPreference === null) {
            this.alertAppPreferences(moduleConfig);
            return;
          }

          const showDialog = await this.settingsProvider.getSettingValue(
            'showDialog'
          );
          const userPreferenceWebsiteOrApp =
            await this.settingsProvider.getSettingValue('appRedirect');

          let appRedirect = false;
          if (userPreferenceWebsiteOrApp === 'App') {
            appRedirect = true;
          }

          if (showDialog) {
            if (appRedirect) {
              const alert = await this.alertCtrl.create({
                header: this.translate.instant('alert.redirect-website-app'),
                backdropDismiss: false,
                mode: 'md',
                buttons: [
                  {
                    text: this.translate.instant('button.cancel'),
                    role: 'cancel',
                  },
                  {
                    text: this.translate.instant('button.ok'),
                    handler: () => {
                      this.launchExternalApp(
                        moduleConfig.appId,
                        moduleConfig.bundleName,
                        moduleConfig.urlAndroid,
                        moduleConfig.urlIOS
                      );
                    },
                  },
                ],
              });
              await alert.present();
            } else {
              this.permissionPromptWebsite(moduleConfig.url);
            }
          } else {
            if (appRedirect) {
              this.launchExternalApp(
                moduleConfig.appId,
                moduleConfig.bundleName,
                moduleConfig.urlAndroid,
                moduleConfig.urlIOS
              );
            } else {
              this.openWebsite(moduleConfig.url);
            }
          }
        } else {
          this.permissionPromptWebsite(moduleConfig.url);
        }
      } else {
        this.permissionPromptWebsite(moduleConfig.url);
      }
    }
  }

  async alertAppPreferences(moduleConfig: IModule) {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('page.settings.setting.appRedirect.lbl'),
      message: this.translate.instant('alert.redirect-first-start'),
      backdropDismiss: false,
      mode: 'md',
      inputs: [
        {
          name: 'Website',
          type: 'radio',
          label: 'Website',
          value: 'Website',
          checked: true,
        },
        {
          name: 'App',
          type: 'radio',
          label: 'App',
          value: 'App',
          checked: false,
        },
      ],
      buttons: [
        {
          text: this.translate.instant('button.cancel'),
          role: 'cancel',
          handler: () => null,
        },
        {
          text: this.translate.instant('button.save'),
          handler: async (decision) => {
            await Preferences.set({
              key: 'setUserPreferenceWebsiteOrApp',
              value: JSON.stringify(true),
            });

            const settings: ISetting[] = Constants.SETTINGS;
            let setting: ISetting;

            for (const settingsItem of settings) {
              if (settingsItem.key === 'appRedirect') {
                setting = settingsItem;
              }
            }

            setting.value = decision;
            // this.logger.debug(
            //   'saveSettings',
            //   'saved setting',
            //   setting,
            //   decision
            // );
            Preferences.set({
              key: 'settings.' + setting.key,
              value: JSON.stringify(setting),
            }).then(() => {
              this.handleWebIntentForModule(moduleConfig);
            });
          },
        },
      ],
    });
    alert.present();
  }

  /**
   * @name launchExternalApp
   * @description launches an external app with the help the plugin AppAvailability
   * @param {string} schemaName
   * @param {string} packageName
   * @param {string} androidUrl
   * @param {string} iosUrl
   */
  private async launchExternalApp(
    schemaName: string,
    packageName: string,
    androidUrl: string,
    iosUrl: string
  ) {
    let app;
    if (this.platform.is('ios')) {
      app = schemaName;
    } else {
      app = packageName;
    }

    const { value } = await AppLauncher.canOpenUrl({ url: app });

    if (value) {
      await AppLauncher.openUrl({ url: app });
    } else {
      // app not installed, open app store
      if (this.platform.is('ios')) {
        this.openWebsite(iosUrl, '_system');
      } else {
        this.openWebsite(androidUrl, '_system');
      }
    }
  }

  private async openWebsite(urlToOpen: string, window = '_blank') {
    await Browser.open({ url: urlToOpen, windowName: window });
  }
}
