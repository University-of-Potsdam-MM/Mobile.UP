import { Component } from '@angular/core';
import {
  IonicPage,
  NavController
} from 'ionic-angular';
import { TranslateService, LangChangeEvent } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { IModule } from "../../library/interfaces";
import { MobileUPApp } from '../../app/app.component';

/**
 * @class HomeyPage
 * @classdesc class for the startscreen of the application
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

  /**
   * @constructor
   * @description Constructor of HomePage
   * @param {NavController} navCtrl
   * @param {TranslateService} translate
   * @param {Storage} storage
   * @param {MobileUPApp} app
   */
  constructor(
      public navCtrl: NavController,
      public translate: TranslateService,
      private storage: Storage,
      private app: MobileUPApp) {
        translate.onLangChange.subscribe((event: LangChangeEvent) => {
          this.sortedModules = this.JsonToArray(this.modules);
        })
    }

  ngOnInit() {
    // try to load modules from storage
    this.storage.get("modules").then(
      modules => {
        if (modules) {
          // if there are modules, use those
          this.modules = modules;
          this.sortedModules = this.JsonToArray(this.modules);
          //console.log(this.modules);
          // console.log("[HomePage]: Using user defined modules");
        } else {
          // if not, try to load the default_modules
          this.storage.get("default_modules").then(
            default_modules => {
              if (default_modules) {
                // use those if possible
                this.modules = default_modules;
                this.sortedModules = this.JsonToArray(this.modules);
                // console.log("[HomePage]: Using default_modules");
              } else {
                // somethings clearly wrong here!
                console.log("[HomePage]: Neither user defined modules nor default_modules in storage!");
                this.app.initializeApp();
                this.navCtrl.setRoot(HomePage);
              }
          });
        }
      }
    );
  }

  /**
   * @name JsonToArray
   * @description converts json object to array
   * @param modules
   * @returns {Array} array
   */
  JsonToArray(modules) {
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
   * @name toggleSelectedState
   * @description toggles selected-state of given module and then saves moduleList to storage
   * @param event
   * @param moduleName
   */
  toggleSelectedState(event, moduleName) {
    event.stopPropagation();
    let currentState = this.modules[moduleName].selected;
    let newState = !currentState;

    this.modules[moduleName].selected = newState;

    console.log(`[HomePage]: '${moduleName}' is now ${newState ? 'selected': 'not selected'}`);

    this.storage.set("modules", this.modules).then(
      value => console.log(`[HomePage]: Saved module list after toggling '${moduleName}'`)
    );
  }

  /**
   * @name openPage
   * @description opens selected page by pushing it on the stack
   * @param event
   * @param {string} pageTitle
   */
  openPage(event, pageTitle:string) {
    console.log(this.modules, pageTitle);
    event.stopPropagation();
    if (this.modules[pageTitle]) {
      this.app.openPage(this.modules[pageTitle]);
    } else {
      console.log(`[HomePage]: Failed to push page, \"${pageTitle}\" does not exist`);
    }
  }

}