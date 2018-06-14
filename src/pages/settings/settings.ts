import {Component} from '@angular/core';
import {IonicPage} from 'ionic-angular';
import {Storage} from "@ionic/storage";
import {ESettingType, ISetting} from "../../library/interfaces";
import {AlertController} from 'ionic-angular';
import set = Reflect.set;

/**
 * Generated class for the SettingsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {

  settings: Array<ISetting> = [];
  current_setting:ISetting;

  constructor(private storage: Storage, private alertCtrl: AlertController) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingsPage');

    //register settings for loading
    this.settings.push({key: "test_1", lbl: "test_1", value: "", type: ESettingType.string});
    this.settings.push({key: "test_2", lbl: "test_2", value: 0, type: ESettingType.number});
    this.settings.push({key: "test_3", lbl: "test_3", value: false, type: ESettingType.boolean});

    this.loadInitalSettings();
  }

  async loadInitalSettings(){
    for(let i = 0; i < this.settings.length; i++){
      let val = await this.getSettingValue(this.settings[i].key);
      if (val != null){
        this.settings[i].value = val;
        console.log("Loaded value for " + this.settings[i]);
      }
    }
  }

  async setSetting(setting, value) {
    console.log("Saved setting",setting,value);
    setting.value = value;
    this.storage.set("settings."+setting.key, setting);
  }

  changeBoolSetting(setting){
    this.setSetting(setting,!setting.value)
  }

  public async getSettingValue(key) {
    let setting: ISetting = await this.storage.get("settings." + key);
    if(setting == null){
      return null;
    }

    switch (setting.type) {
      case ESettingType.number: {
        return +setting.value
      }
      case ESettingType.boolean: {
        return setting.value == "1";
      }
      case ESettingType.string: {
        return setting.value;
      }
      default:{
        return setting.value
      }
    }
  }

  /**
   * Returns string version of setting enum type since enums to work in templates
   * @param {ISetting} setting - setting to get type for
   * @returns {string} - setting type as string (e.g. "boolean", "number", "string")
   */
  getSettingType(setting: ISetting) {
    switch (setting.type) {
      case ESettingType.number: {
        return "number"
      }
      case ESettingType.boolean: {
        return "boolean"
      }
      default: {
        return "string"
      }
    }
  }

  /**
   *
   * @param {ISetting} setting
   */
  openPrompt(setting: ISetting) {
    this.current_setting = setting;

    let type:string;
    switch (setting.type) {
      case ESettingType.number: {
        type = 'number';
        break;
      }
      default: {
        type = 'text';
        break;
      }
    }

    let alert = this.alertCtrl.create({
      title: '',
      inputs: [
        {
          name: setting.key,
          placeholder: setting.lbl, //TODO localize
          value: setting.value,
          type: type
        }
      ],
      buttons: [
        {
          text: 'Cancel', //TODO localize
          role: 'cancel',
          handler: data => { }
        },
        {
          text: 'Ok', //TODO localize
          handler: data => {
            console.log(data);
            this.setSetting(setting, data[setting.key])
          }
        }
      ]
    });
    alert.present();
  }
}
