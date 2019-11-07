import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';
import { IModule, IConfig } from 'src/app/lib/interfaces';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { HTTP } from '@ionic-native/http/ngx';
import { ToastController } from '@ionic/angular';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage extends AbstractPage implements OnInit {
  icon_selected = 'star';
  icon_not_selected = 'star-outline';

  modules: {[moduleName: string]: IModule} = {};
  sortedModules = [];

  constructor(
    private translate: TranslateService,
    private storage: Storage,
    private nativeHTTP: HTTP,
    private toastCtrl: ToastController,
    private inAppBrowser: InAppBrowser
  ) {
    super();
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      this.setupModules();
      if (this.platform.is('android') || this.platform.is('ios')) {
        this.checkAppUpdate();
      }
    }).catch(error => {
      this.logger.error('ngOnInit', 'platformReady', error);
    });
  }

  async setupModules() {
    const userModules = await this.storage.get('moduleList');
    const configModules = this.buildDefaultModulesList();

    if (!userModules) {
      // user hasnˋt set any unique favorites
      this.modules = configModules;
      this.sortedModules = this.jsonToArray(configModules);
    } else {
      // user has set custom favorites
      // check if pages still exist and if new pages are in config
      const moduleList: {[modulesName: string]: IModule} = {};
      for (const moduleName in configModules) {
        if (configModules.hasOwnProperty(moduleName)) {
          let found = false;
          for (const userModuleName in userModules) {
            if (userModules.hasOwnProperty(userModuleName)) {
              if (moduleName === userModuleName) {
                found = true;
                // this preserves favorites that the user eventually modified
                moduleList[userModuleName] = userModules[userModuleName];
                break;
              }
            }
          }

          if (!found) {
            // the module is either new or has been renamed
            // add it from config
            moduleList[moduleName] = configModules[moduleName];
          }

          this.modules = moduleList;
          this.sortedModules = this.jsonToArray(moduleList);
        }
      }
    }
  }

  async checkAppUpdate() {
    const remoteConfigUrl = this.config.webservices.endpoint.config.url;

    await this.nativeHTTP.setSSLCertMode('nocheck');
    this.nativeHTTP.get(remoteConfigUrl, {}, {}).then(async response => {
      const remoteConfig: IConfig = JSON.parse(response.data);
      if (remoteConfig && remoteConfig.appVersion) {
        const remoteVersion = remoteConfig.appVersion;
        const localVersion = this.config.appVersion;

        this.logger.debug('checkAppUpdate', 'App Version: ' + localVersion + ' / ' + remoteVersion);

        if (remoteVersion > localVersion) {
          // app update should be available in app stores
          const toast = await this.toastCtrl.create({
            message: this.translate.instant('alert.app-update'),
            position: 'top',
            // color: 'primary',
            cssClass: 'updateToast',
            buttons: [
              {
                side: 'end',
                // role: 'cancel',
                icon: 'appstore',
                handler: () => {
                  if (this.platform.is('android')) {
                    this.inAppBrowser.create(this.config.urlAndroid, '_system');
                  } else { this.inAppBrowser.create(this.config.urlIOS, '_system'); }
                }
              }
            ]
          });
          toast.present();
          setTimeout(() => {
            toast.dismiss();
          }, 5000);
        }
      }
    }).catch(error => {
      this.logger.error('checkAppUpdate', 'fetching config', error);
    });
  }

  /**
   * @name JsonToArray
   * @description converts json object to array
   * @param modules
   * @returns {Array} array
   */
  jsonToArray(modules) {
    const array = [];
    for (const key in modules) {
      if (modules.hasOwnProperty(key)) {
        this.translate.get(modules[key].i18nKey).subscribe(
          value => {
            modules[key].translation = value;
            array.push(modules[key]);
          }
        );
      }
    }
    // this.orderPipe.transform(this.sortedModules, 'translation');
    return array;
  }

  /**
   * @name toggleSelectedState
   * @description toggles selected-state of given module and then saves moduleList to storage
   * @param event
   * @param moduleName
   */
  toggleSelectedState(event, moduleName) {
    // use this to only trigger fav button and not open module page
    event.stopPropagation();

    this.modules[moduleName].selected = !this.modules[moduleName].selected;
    this.logger.debug('toggleSelectedState',
    `'${moduleName}' is now ${this.modules[moduleName].selected ? 'selected' : 'not selected'}`);

    this.storage.set('moduleList', this.modules).then(
      () => this.logger.debug('toggleSelectedState', `saved module list after toggling '${moduleName}'`)
    );
  }

  /**
   * @name buildDefaultModulesList
   * @description builds list of default_modules that should be displayed on HomePage
   */
  buildDefaultModulesList(): {[modulesName: string]: IModule} {
    const moduleList: {[modulesName: string]: IModule} = {};
    const modules = this.config.modules;

    for (const moduleName in modules) {
      if (modules.hasOwnProperty(moduleName)) {
        const moduleToAdd: IModule = modules[moduleName];
        if (!moduleToAdd.hide) {
          moduleToAdd.i18nKey = `page.${moduleToAdd.componentName}.title`;
          moduleList[moduleName] = moduleToAdd;
        }
      }
    }

    this.logger.debug('buildDefaultModulesList');
    return moduleList;
  }
}
