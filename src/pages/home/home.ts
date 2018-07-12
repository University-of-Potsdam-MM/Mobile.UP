import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { TranslateService } from "@ngx-translate/core";
import {Storage} from "@ionic/storage";
import {ComponentsProvider} from "../../providers/components/components";
import {IModule} from "../../library/interfaces";
/**
 * HomePage
 */
@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {

  objectKey = Object.keys;
  editMode:boolean = false;
  modules:{[moduleName:string]:IModule} = {};

  constructor(
      public navCtrl: NavController,
      public translate: TranslateService,
      private storage: Storage,
      private components: ComponentsProvider) {
  }

  ionViewDidLoad(){
    this.storage.get("modules").then(
      modules => {
        this.modules = modules;
      }
    )
  }

  /**
   * simlpy toggles the editMode variable
   */
  toggleEditMode(){
    this.editMode = !this.editMode;
  }

  /**
   * opens selected page by pushing it on the stack
   * @param {string} pageTitle
   */
  openPage(pageTitle:string){
    this.components.getComponent(pageTitle).subscribe(
      component => {
        console.log(`[HomePage]: Opening \"${pageTitle}\"`);
        this.navCtrl.push(component);
      },
      error => {
        console.log(`[HomePage]: Failed to push page, \"${pageTitle}\" does not exist`);
      }
    );
  }
}
