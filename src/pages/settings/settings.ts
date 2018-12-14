import {Component} from '@angular/core';
import {IonicPage} from 'ionic-angular';
import {Storage} from "@ionic/storage";
import {ESettingType, ISetting, ISettingOption} from "../../library/interfaces";
import {AlertController} from 'ionic-angular';
import {TranslateService} from "@ngx-translate/core";
import * as Constants from './setting_config';

@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {

  settings: Array<ISetting> = [];
  current_setting: ISetting;
  settings_initializes: boolean = false;

  constructor(private storage: Storage, private alertCtrl: AlertController, public translate: TranslateService) {
    //TODO nav param to push setting and highlight it
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingsPage');

    //register settings for loading
    this.settings = Constants.SETTINGS;
    this.loadInitialSettings();

    setTimeout(()=>{ this.settings_initializes = true; }, 500);

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
        label: this.translate.instant("page.settings.setting." + setting.key + ".lbl"),
        value: setting.value,
        icon: setting.icon,
        type: type
      })
    } else {
      for (let i = 0; i < setting.options.length; i++) {
        let option: ISettingOption = setting.options[i];
        let checked = 0;
        if (setting.value == option.key && !(setting.value instanceof Array)) {
          checked = 1;
        } else {
          for (let h = 0; h < setting.value.length; h++) {
            if (setting.value[h] == option.key) {
              checked = 1;
            }
          }
        }

        var optionLbl;
        this.translate.get("page.settings.setting." + setting.key).subscribe(value => {
          if (value.options) {
            if (value.options[option.key] == null) {
              optionLbl = option.key;
            } else { optionLbl = value.options[option.key] }
          } else { optionLbl = option.key }
        });
        input.push({
          name: setting.key + "." + option.key,
          label: optionLbl,
          value: option.key,
          icon: setting.icon,
          checked: checked,
          type: type
        })
      }
    }

    let text_ok = this.translate.instant("button.ok");
    let text_cancel = this.translate.instant("button.cancel");

    var infoText = "";
    this.translate.get("page.settings.setting." + setting.key).subscribe(value => {
      if (value.info) {
        infoText = value.info;
      }
    });
    let alert = this.alertCtrl.create({
      title: this.translate.instant("page.settings.setting." + setting.key + ".lbl"),
      subTitle: infoText,
      inputs: input,
      buttons: [
        {
          text: text_cancel,
          role: 'cancel'
        },
        {
          text: text_ok,
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

  getValueLabel(setting: ISetting) {
    if (setting.options) {
      var optionLbl;
      this.translate.get("page.settings.setting." + setting.key).subscribe(value => {
        if (value.options) {
          if (value.options[setting.value] == null) {
            optionLbl = setting.value;
          } else { optionLbl = value.options[setting.value] }
        } else { optionLbl = setting.value }
      });

      return optionLbl;
    } else { return setting.value; }
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
    // mainly so the boolean setting does not get caught in a onChange loop by loading/setting/change/change/..
    if (!this.settings_initializes){
      console.log("Prevented save before load");
      return false;
    }
    setting.value = value;
    console.log("Saved setting", setting, value);
    this.storage.set("settings." + setting.key, setting);

    // check if language was changed because it needs to change immediatly
    if (setting.key == "language") {
      if (value == "Deutsch") {
        this.translate.use("de");
      } else {
        this.translate.use("en");
      }
    }
  }

  /**
   * called by toggle to switch boolean setting state and save it
   * @param setting {ISetting} - setting to be switched
   */
  changeBoolSetting(setting: ISetting) {
    this.setSetting(setting, !setting.value);
    return false;
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
      case ESettingType.placeholder: {
        return "placeholder"
      }
      default: {
        return "string"
      }
    }
  }
}
