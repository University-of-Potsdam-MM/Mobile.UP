import { Component } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { TranslateService } from "@ngx-translate/core";
import { Storage } from "@ionic/storage";
import { ComponentsProvider } from "../../providers/components/components";
import { IModule } from "../../library/interfaces";
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
    // try to load modules from storage
    this.storage.get("modules").then(
      modules => {
        if(modules){
          // if there are modules, use those
          this.modules = modules;
          console.log("[HomePage]: Using user defined modules");
        } else {
          // if not, try to load the default_modules
          this.storage.get("default_modules").then(
            default_modules => {
              if(default_modules) {
                // use those if possible
                this.modules = default_modules;
                console.log("[HomePage]: Using default_modules");
              } else {
                // somethings clearly wrong here!
                console.log("[HomePage]: Neither user defined modules nor default_modules in storage!");
              }
          })
        }

      }
    )
  }

  /**
   * simlpy toggles the editMode variable and saves moduleList to storage if
   * editMode has been disabled
   */
  toggleEditMode(){
    this.editMode = !this.editMode;
    console.log(`[HomePage]: editMode is now ${this.editMode ? 'enabled' : 'disabled'}`);
    if(this.editMode == false) {
      // editMode was true
      this.storage.set("modules", this.modules);
      console.log("[HomePage]: Saved module list after editing");
    }
  }

  /**
   * opens selected page by pushing it on the stack, but only if editMode is
   * currently disabled
   * @param {string} pageTitle
   */
  openPage(pageTitle:string){
    if(!this.editMode){
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
}
