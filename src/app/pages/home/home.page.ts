import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';
import { IModule } from 'src/app/lib/interfaces';
import { WebIntentService } from 'src/app/services/web-intent/web-intent.service';
import { AbstractPage } from 'src/app/lib/abstract-page';

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
    private webIntent: WebIntentService,
    private storage: Storage,
  ) {
    super();
  }

  ngOnInit() {
    this.storage.get('modules').then(modules => {
      if (modules) {
        this.modules = modules;
        this.sortedModules = this.jsonToArray(this.modules);
      } else {
        this.storage.get('default_modules').then(default_modules => {
          if (default_modules) {
            this.modules = default_modules;
            this.sortedModules = this.jsonToArray(this.modules);
          } else {
            // something clearly went wrong here
            console.log('[HomePage]: Neither user defined modules nor default_modules in storage!');
            this.buildDefaultModulesList();
          }
        });
      }
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
    event.stopPropagation();
    const currentState = this.modules[moduleName].selected;
    const newState = !currentState;

    this.modules[moduleName].selected = newState;

    console.log(`[HomePage]: '${moduleName}' is now ${newState ? 'selected' : 'not selected'}`);

    this.storage.set('modules', this.modules).then(
      () => console.log(`[HomePage]: Saved module list after toggling '${moduleName}'`)
    );
  }

  /**
   * @name openPage
   * @description opens selected page by pushing it on the stack
   * @param event
   * @param {string} pageTitle
   */
  openPage(modules: IModule) {
    if (modules.url) {
      this.webIntent.handleWebIntentForModule(modules.componentName);
    } else {
      this.navCtrl.navigateForward('/' + modules.componentName);
    }
  }

  /**
   * @name buildDefaultModulesList
   * @description builds list of default_modules that should be displayed on HomePage
   */
  buildDefaultModulesList() {
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

    this.modules = moduleList;
    this.sortedModules = this.jsonToArray(this.modules);

    this.storage.set('default_modules', moduleList);
    console.log('[Mobile.UP]: created default moduleList from config');
  }
}
