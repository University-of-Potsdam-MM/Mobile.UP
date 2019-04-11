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

  async ngOnInit() {
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
    	}
    	
    	this.modules = moduleList;
    	this.sortedModules = this.jsonToArray(moduleList);
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
    console.log(`[HomePage]: '${moduleName}' is now ${this.modules[moduleName].selected ? 'selected' : 'not selected'}`);

    this.storage.set('moduleList', this.modules).then(
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
  buildDefaultModulesList():{[modulesName: string]: IModule} {
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

    console.log('[Mobile.UP]: created default moduleList from config');
    return moduleList;
  }
}
