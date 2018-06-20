import {Component} from '@angular/core';
import {IonicPage} from 'ionic-angular';
import {Storage} from "@ionic/storage";
import {ESettingType, ISetting, ISettingOption} from "../../library/interfaces";
import {AlertController} from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {

  settings: Array<ISetting> = [];
  current_setting: ISetting;

  constructor(private storage: Storage, private alertCtrl: AlertController) {
    //TODO nav param to push setting and highlight it
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingsPage');

    //register settings for loading
    this.settings.push({key: "test_1", lbl: "test_1", value: "", type: ESettingType.string, options: []});
    this.settings.push({key: "test_2", lbl: "test_2", value: 0, type: ESettingType.number, options: []});
    this.settings.push({key: "test_3", lbl: "test_3", value: false, type: ESettingType.boolean, options: []});
    this.settings.push({
      key: "test_4",
      lbl: "test_4",
      value: "0",
      options: [{key: 0, lbl: "deaktivated"}, {key: 1, lbl: "1"}, {key: 2, lbl: "2"}],
      type: ESettingType.number_radio
    });
    this.settings.push({
      key: "test_5",
      lbl: "test_5",
      value: "test 1",
      options: [{key: "test_1", lbl: "Test 1"}, {key: "test_2", lbl: "Test 2"}, {key: "test_3", lbl: "Test 3"}],
      type: ESettingType.string_radio
    });
    this.settings.push({
      key: "test_6",
      lbl: "test_6",
      value: "test_1",
      options: [{key: "test_1", lbl: "Test 1"}, {key: "test_2", lbl: "Test 2"}, {key: "test_3", lbl: "Test 3"}],
      type: ESettingType.checkbox
    });
    //TODO add placeholder type for headers

    this.loadInitialSettings();
  }

  /**
   * Load initial values for settings from storage
   * @returns {Promise<void>}
   */
  async loadInitialSettings() {
    for (let i = 0; i < this.settings.length; i++) {
      let val = await this.getSettingValue(this.settings[i].key);
      if (val != null) {
        this.settings[i].value = val;
        console.log("Loaded value for ", this.settings[i]);
      }
    }
  }

  /**
   * Set setting value and save it
   * @param setting {ISetting} - setting
   * @param value - value to set for setting
   * @returns {Promise<void>}
   */
  async setSetting(setting: ISetting, value) {
    setting.value = value;
    console.log("Saved setting", setting, value);
    this.storage.set("settings." + setting.key, setting);
  }

  /**
   * called by toggle to switch boolean setting state and save it
   * @param setting {ISetting} - setting to be switched
   */
  changeBoolSetting(setting: ISetting) {
    this.setSetting(setting, !setting.value)
  }

  /**
   * Returns value of setting in usable format (bool as bool, number as number, string as string)
   * @param key - key of setting to get
   * @returns {Promise<any>}
   */
  public async getSettingValue(key) {
    let setting: ISetting = await this.storage.get("settings." + key);
    if (setting == null) {
      return null;
    }

    switch (setting.type) {
      case ESettingType.number: {
        return +setting.value;
      }
      case ESettingType.number_radio: {
        return +setting.value;
      }
      case ESettingType.boolean: {
        return setting.value == "1";
      }
      case ESettingType.string: {
        return setting.value;
      }
      default: {
        return setting.value;
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
      case ESettingType.string_radio: {
        return "radio"
      }
      case ESettingType.number_radio: {
        return "radio"
      }
      case ESettingType.checkbox: {
        return "checkbox"
      }
      default: {
        return "string"
      }
    }
  }

  /**
   * Opens input dialog with correct type for setting
   * @param {ISetting} setting
   */
  openPrompt(setting: ISetting) {
    this.current_setting = setting;

    let type: string;
    switch (setting.type) {
      case ESettingType.number: {
        type = 'number';
        break;
      }
      default: {
        type = 'text';
        break;
      }
      case ESettingType.string_radio: {
        type = "radio";
        break;
      }
      case ESettingType.number_radio: {
        type = "radio";
        break;
      }
      case ESettingType.checkbox: {
        type = "checkbox";
        break;
      }
    }

    let input = [];
    if (setting.type == ESettingType.string || setting.type == ESettingType.number) {
      input.push({
        name: setting.key,
        label: setting.lbl, //TODO localize
        value: setting.value,
        type: type
      })
    } else {
      for (let i = 0; i < setting.options.length; i++) {
        let option:ISettingOption = setting.options[i];
        let checked = 0;
        if (setting.value == option.key && !(setting.value instanceof Array) ) {
          checked = 1;
        }else{
          for(let h = 0; h < setting.value.length; h++){
            if(setting.value[h] == option.key){
              checked = 1;
            }
          }
        }

        input.push({
          name: setting.key + "." + option.key,
          label: option.lbl, //TODO localize
          value: option.key,
          checked: checked,
          type: type
        })
      }
    }

    let alert = this.alertCtrl.create({
      title: setting.lbl,
      inputs: input,
      buttons: [
        {
          text: 'Cancel', //TODO localize
          role: 'cancel',
          handler: data => {
          }
        },
        {
          text: 'Ok', //TODO localize
          handler: data => {
            console.log(data);
            if (data[setting.key] != null) {
              this.setSetting(setting, data[setting.key])
            } else {
              this.setSetting(setting, data)
            }
          }
        }
      ]
    });
    alert.present();
  }
}
