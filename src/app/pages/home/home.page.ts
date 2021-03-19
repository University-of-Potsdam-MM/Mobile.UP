/* eslint-disable guard-for-in */
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IModule, IConfig } from 'src/app/lib/interfaces';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { ToastController } from '@ionic/angular';
import { ConfigService } from 'src/app/services/config/config.service';
import { Storage } from '@capacitor/storage';
import { Browser } from '@capacitor/browser';
import '@capacitor-community/http';
import { Plugins } from '@capacitor/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage extends AbstractPage implements OnInit {
  icon_selected = 'star';
  icon_not_selected = 'star-outline';

  modules: { [moduleName: string]: IModule } = {};
  sortedModules = [];
  editingMode = false;

  constructor(
    private translate: TranslateService,
    private toastCtrl: ToastController
  ) {
    super();
  }

  ngOnInit() {
    this.platform
      .ready()
      .then(() => {
        this.setupModules();
        if (this.platform.is('android') || this.platform.is('ios')) {
          this.checkAppUpdate();
        }
      })
      .catch((error) => {
        // this.logger.error('ngOnInit', 'platformReady', error);
      });
  }

  async setupModules() {
    const userModulesObj = await Storage.get({ key: 'moduleList' });
    const userModules = JSON.parse(userModulesObj.value);
    const configModules = this.buildDefaultModulesList();

    if (!userModules) {
      // user hasnˋt set any unique favorites
      this.modules = configModules;
      this.sortedModules = this.jsonToArray(configModules);
    } else {
      // user has set custom favorites
      // check if pages still exist and if new pages are in config
      const moduleList: { [modulesName: string]: IModule } = {};
      for (const moduleName in configModules) {
        let found = false;
        for (const userModuleName in userModules) {
          if (moduleName === userModuleName) {
            found = true;
            // this preserves favorites that the user eventually modified
            moduleList[userModuleName] = userModules[userModuleName];
            break;
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

  async checkAppUpdate() {
    const remoteConfigUrl =
      ConfigService.config.webservices.endpoint.config.url;

    const { Http } = Plugins;

    const ret = await Http.request({
      method: 'GET',
      url: remoteConfigUrl,
    });

    if (ret && ret.data) {
      const remoteConfig: IConfig = JSON.parse(ret.data);
      if (remoteConfig && remoteConfig.appVersion) {
        const remoteVersionString = remoteConfig.appVersion;
        const localVersionString = ConfigService.config.appVersion;

        // this.logger.debug(
        //   'checkAppUpdate',
        //   'App Version: ' + localVersionString + ' / ' + remoteVersionString
        // );

        const remoteVersionNumber = Number(
          remoteVersionString.split('.').join('')
        );
        const localVersionNumber = Number(
          localVersionString.split('.').join('')
        );

        if (remoteVersionNumber > localVersionNumber) {
          // app update should be available in app stores
          const platformStoreIcon = this.platform.is('ios')
            ? 'logo-apple-appstore'
            : 'logo-google-playstore';
          const toast = await this.toastCtrl.create({
            message: this.translate.instant('alert.app-update'),
            duration: 3000,
            position: 'top',
            color: 'primary',
            cssClass: 'updateToast',
            mode: 'ios',
            buttons: [
              {
                side: 'end',
                // role: 'cancel',
                icon: platformStoreIcon,
                handler: () => {
                  if (this.platform.is('android')) {
                    Browser.open({
                      url: ConfigService.config.urlAndroid,
                      windowName: '_system',
                    });
                  } else {
                    Browser.open({
                      url: ConfigService.config.urlIOS,
                      windowName: '_system',
                    });
                  }
                },
              },
            ],
          });
          toast.present();
          setTimeout(() => {
            toast.dismiss();
          }, 5000);
        }
      }
    }
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
      this.translate.get(modules[key].i18nKey).subscribe((value) => {
        modules[key].translation = value;
        array.push(modules[key]);
      });
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
  async toggleSelectedState(event, moduleName) {
    // use this to only trigger fav button and not open module page
    event.stopPropagation();

    this.modules[moduleName].selected = !this.modules[moduleName].selected;
    // this.logger.debug(
    //   'toggleSelectedState',
    //   `'${moduleName}' is now ${
    //     this.modules[moduleName].selected ? 'selected' : 'not selected'
    //   }`
    // );

    await Storage.set({
      key: 'moduleList',
      value: JSON.stringify(this.modules),
    }).then(() => {
      // this.logger.debug(
      //   'toggleSelectedState',
      //   `saved module list after toggling '${moduleName}'`
      // );
    });
  }

  /**
   * @name buildDefaultModulesList
   * @description builds list of default_modules that should be displayed on HomePage
   */
  buildDefaultModulesList(): { [modulesName: string]: IModule } {
    const moduleList: { [modulesName: string]: IModule } = {};
    const modules = ConfigService.config.modules;

    for (const moduleName in modules) {
      const moduleToAdd: IModule = modules[moduleName];
      moduleToAdd.x = moduleToAdd.y = moduleToAdd.rows = moduleToAdd.cols = undefined;
      if (!moduleToAdd.hide) {
        moduleToAdd.i18nKey = `page.${moduleToAdd.componentName}.title`;
        moduleList[moduleName] = moduleToAdd;
      }
    }

    // this.logger.debug('buildDefaultModulesList');
    return moduleList;
  }

  async onGridChanged() {
    // we can just store the existing modules again because gridster is
    // operating on the same object
    // this.logger.debug('onGridChanged', 'grid was changed, saving changed module list');
    await Storage.set({
      key: 'moduleList',
      value: JSON.stringify(this.modules),
    });
  }

  /**
   * opens a page by using it's module
   *
   * @description opens selected page by pushing it on the stack
   * @param module {IModule} module to be used
   * @param params {any} params {any} params that should by passed on
   */
  openModule(moduleToOpen: IModule, params: any = {}, fromFavorites) {
    if (!(this.editingMode && fromFavorites)) {
      if (moduleToOpen.url) {
        this.webIntent.handleWebIntentForModule(moduleToOpen);
      } else {
        this.navCtrl.navigateForward('/' + moduleToOpen.componentName, {
          state: params,
        });
      }
    }
  }
}
