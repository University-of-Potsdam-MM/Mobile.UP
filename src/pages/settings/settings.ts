import {Component} from '@angular/core';
import {IonicPage} from 'ionic-angular';
import {Storage} from "@ionic/storage";
import {ESettingType, ISetting, ISettingOption} from "../../library/interfaces";
import {AlertController} from 'ionic-angular';
import {TranslateService} from "@ngx-translate/core";

@IonicPage()
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {

  settings: Array<ISetting> = [];
  current_setting: ISetting;

  constructor(private storage: Storage, private alertCtrl: AlertController, public translate: TranslateService) {
    //TODO nav param to push setting and highlight it
  }

  //TODO test on android (possible permission missing)

  ionViewDidLoad() {
    console.log('ionViewDidLoad SettingsPage');

    //register settings for loading
    this.settings.push({key: "test_1", value: "", type: ESettingType.string, options: []});
    this.settings.push({key: "test_2", value: 0, type: ESettingType.number, options: []});
    this.settings.push({key: "test_3", value: false, type: ESettingType.boolean, options: []});
    this.settings.push({key: "test_ph", value: false, type: ESettingType.placeholder});
    this.settings.push({
      key: "test_4",
      value: "0",
      options: [{key: 0, lbl: "deaktivated"}, {key: 1, lbl: "1"}, {key: 2, lbl: "2"}],
      type: ESettingType.number_radio
    });

    this.settings.push({
      key: "test_5",
      value: "test 1",
      options: [{key: "test_1", lbl: "Test 1"}, {key: "test_2", lbl: "Test 2"}, {key: "test_3", lbl: "Test 3"}],
      type: ESettingType.string_radio
    });
    this.settings.push({
      key: "test_6",
      value: "test_1",
      options: [{key: "test_1", lbl: "Test 1"}, {key: "test_2", lbl: "Test 2"}, {key: "test_3", lbl: "Test 3"}],
      type: ESettingType.checkbox
    });
    //TODO add placeholder type for headers

    for (let i = 0; i < this.settings.length; i++) {
      this.translate.get("page.settings.setting." + this.settings[i].key).subscribe(
        value => {
          this.settings[i].lbl = value.lbl;
          this.settings[i].info = value.info;
          if (value.options != null) {
            for (let h = 0; h < this.settings[i].options.length; h++) {
              if (value.options[this.settings[i].options[h].key] == null) {
                this.settings[i].options[h].lbl = this.settings[i].options[h].key;
              } else {
                this.settings[i].options[h].lbl = value.options[this.settings[i].options[h].key];
              }
            }
          }
        }
      )
    }

    this.loadInitialSettings();
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

        input.push({
          name: setting.key + "." + option.key,
          label: option.lbl, //TODO localize
          value: option.key,
          checked: checked,
          type: type
        })
      }
    }

    let text_ok = "Ok";
    let text_cancel = "Cancel";

    this.translate.get("button").subscribe(
      value => {
        text_ok = value.ok;
        text_cancel = value.cancel;
      }
    );

    let alert = this.alertCtrl.create({
      title: setting.lbl,
      subTitle: setting.info,
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
      case ESettingType.placeholder: {
        return "placeholder"
      }
      default: {
        return "string"
      }
    }
  }
}
