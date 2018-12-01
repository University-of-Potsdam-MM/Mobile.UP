import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { ComponentsProvider } from "../../providers/components/components";
import { IModule } from "../../library/interfaces";
import { WebIntentProvider } from '../../providers/web-intent/web-intent';

/**
 * HomePage
 */
@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {
  icon_selected:string = "star";
  icon_not_selected:string = "star-outline";

  modules:{[moduleName:string]:IModule} = {};
  sortedModules = [];

  session:string = "";

  constructor(
      public navCtrl: NavController,
      public translate: TranslateService,
      private storage: Storage,
      private webIntent: WebIntentProvider,
      private components: ComponentsProvider) {
    }

  ionViewDidLoad(){
    // try to load modules from storage
    this.storage.get("modules").then(
      modules => {
        if(modules){
          // if there are modules, use those
          this.modules = modules;
          this.sortedModules = this.JsonToArray(this.modules);
          //console.log(this.modules);
          // console.log("[HomePage]: Using user defined modules");
        } else {
          // if not, try to load the default_modules
          this.storage.get("default_modules").then(
            default_modules => {
              if(default_modules) {
                // use those if possible
                this.modules = default_modules;
                this.sortedModules = this.JsonToArray(this.modules);
                // console.log("[HomePage]: Using default_modules");
              } else {
                // somethings clearly wrong here!
                console.log("[HomePage]: Neither user defined modules nor default_modules in storage!");
              }
          })
        }
      }
    )
    console.log(this.sortedModules);
  }

  /**
   * convertes json object to array
   * @param modules
   */

  JsonToArray(modules){
    var array = [];
    for (var key in modules){
      this.translate.get(modules[key].i18nKey).subscribe(
        value => {
          modules[key].translation = value;
          array.push(modules[key]);
        }
      );
    }
    //this.orderPipe.transform(this.sortedModules, 'translation');
    return array;
  }

  /**
   * toggles selected-state of given module and then saves moduleList to storage
   * @param moduleName
   */
  toggleSelectedState(moduleName){
    let currentState = this.modules[moduleName].selected;
    let newState = !currentState;

    this.modules[moduleName].selected = newState;

    console.log(`[HomePage]: '${moduleName}' is now ${newState ? 'selected': 'not selected'}`);

    this.storage.set("modules", this.modules).then(
      value => console.log(`[HomePage]: Saved module list after toggling '${moduleName}'`)
    );

  }

  /**
   * opens selected page by pushing it on the stack
   * @param {string} pageTitle
   */
  openPage(pageTitle:string) {
    this.components.getComponent(pageTitle).subscribe(
    component => {
      if (component == "webIntent") {
        this.webIntent.handleWebIntent(pageTitle);
      } else { this.navCtrl.push(component); }
      },
      error => {
        console.log(`[HomePage]: Failed to push page, \"${pageTitle}\" does not exist`);
      }
    );
  }
}