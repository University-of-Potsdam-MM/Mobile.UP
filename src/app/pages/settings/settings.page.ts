import { Component, OnInit } from '@angular/core';
import { Storage } from '@ionic/storage';
import { TranslateService } from '@ngx-translate/core';
import * as Constants from '../../services/settings/settings_config';
import { AlertController } from '@ionic/angular';
import * as moment from 'moment';
import { ISetting, ESettingType, ISettingOption } from 'src/app/lib/interfaces';
import { AbstractPage } from 'src/app/lib/abstract-page';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage extends AbstractPage implements OnInit {

  settings: Array<ISetting> = [];
  settings_initializes = false;
  current_setting: ISetting;

  constructor(
    private storage: Storage,
    private alertCtrl: AlertController,
    private translate: TranslateService
  ) {
    super();
  }

  ngOnInit() {
    this.settings = Constants.SETTINGS;
    this.loadInitialSettings().then(() => {
      this.settings_initializes = true;
    });
  }

  /**
   * Load initial values for settings from storage
   * @returns {Promise<void>}
   */
  async loadInitialSettings() {
    for (let i = 0; i < this.settings.length; i++) {
      const val = await this.getSettingValue(this.settings[i].key);
      if (val != null) {
        this.settings[i].value = val;
        console.log('Loaded value for ', this.settings[i]);
      }
    }
  }

  /**
   * Returns value of setting in usable format (bool as bool, number as number, string as string)
   * @param key - key of setting to get
   * @returns {Promise<any>}
   */
  public async getSettingValue(key) {
    const setting: ISetting = await this.storage.get('settings.' + key);
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
        return setting.value;
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
   * Opens input dialog with correct type for setting
   * @param {ISetting} setting
   */
  async openPrompt(setting: ISetting) {
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
        type = 'radio';
        break;
      }
      case ESettingType.number_radio: {
        type = 'radio';
        break;
      }
      case ESettingType.checkbox: {
        type = 'checkbox';
        break;
      }
    }

    const input = [];
    if (setting.type === ESettingType.string || setting.type === ESettingType.number) {
      input.push({
        name: setting.key,
        label: this.translate.instant('page.settings.setting.' + setting.key + '.lbl'),
        value: setting.value,
        icon: setting.icon,
        type: type
      });
    } else {
      for (let i = 0; i < setting.options.length; i++) {
        const option: ISettingOption = setting.options[i];
        let checked = 0;
        if (setting.value === option.key && !(setting.value instanceof Array)) {
          checked = 1;
        } else {
          for (let h = 0; h < setting.value.length; h++) {
            if (setting.value[h] === option.key) {
              checked = 1;
            }
          }
        }

        let optionLbl;
        this.translate.get('page.settings.setting.' + setting.key).subscribe(value => {
          if (value.options) {
            if (value.options[option.key] == null) {
              optionLbl = option.key;
            } else { optionLbl = value.options[option.key]; }
          } else { optionLbl = option.key; }
        });
        input.push({
          name: setting.key + '.' + option.key,
          label: optionLbl,
          value: option.key,
          icon: setting.icon,
          checked: checked,
          type: type
        });
      }
    }

    const text_ok = this.translate.instant('button.ok');
    const text_cancel = this.translate.instant('button.cancel');

    let infoText = '';
    this.translate.get('page.settings.setting.' + setting.key).subscribe(value => {
      if (value.info) {
        infoText = value.info;
      }
    });
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('page.settings.setting.' + setting.key + '.lbl'),
      message: infoText,
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
              this.setSetting(setting, data[setting.key]);
            } else {
              this.setSetting(setting, data);
            }
          }
        }
      ]
    });
    alert.present();
  }

  /**
   *  gets label for settings with more than one value
   * @param setting
   */
  getValueLabel(setting: ISetting) {
    if (setting.options) {
      let optionLbl = '';
      this.translate.get('page.settings.setting.' + setting.key).subscribe(value => {
        if (value.options) {
          if (Array.isArray(setting.value)) {
            let i;
            for (i = 0; i < setting.value.length; i++) {
              if (value.options[setting.value[i]] == null) {
                if (optionLbl !== '') {
                  const foundComma = optionLbl.indexOf(',');
                  if (foundComma !== -1) {
                    optionLbl = optionLbl.substring(0, foundComma);
                  }
                  optionLbl += ', ' + String(setting.value.length - 1) + '+';
                } else {
                  optionLbl += String(setting.value);
                }
              } else {
                if (optionLbl !== '') {
                  const foundComma = optionLbl.indexOf(',');
                  if (foundComma !== -1) {
                    optionLbl = optionLbl.substring(0, foundComma);
                  }
                  optionLbl += ', ' + String(setting.value.length - 1) + '+';
                } else {
                  optionLbl += String(value.options[setting.value[i]]);
                }
              }
            }
          } else {
            if (value.options[setting.value] == null) {
              optionLbl = setting.value;
            } else { optionLbl = value.options[setting.value]; }
          }
        } else { optionLbl = setting.value; }
      });

      return optionLbl;
    } else { return setting.value; }
  }

  /**
   * Set setting value and save it
   * @param setting {ISetting} - setting
   * @param value - value to set for setting
   * @returns {Promise<void>}
   */
  setSetting(setting: ISetting, value) {
    // mainly so the boolean setting does not get caught in a onChange loop by loading/setting/change/change/..
    if (!this.settings_initializes) {
      console.log('Prevented save before load');
      return false;
    }
    setting.value = value;
    console.log('Saved setting', setting, value);
    this.storage.set('settings.' + setting.key, setting);

    // check if language was changed because it needs to change immediatly
    if (setting.key === 'language') {
      if (value === 'Deutsch') {
        this.translate.use('de');
        moment.locale('de');
      } else {
        this.translate.use('en');
        moment.locale('en');
      }
    }
  }

  /**
   * called by toggle to switch boolean setting state and save it
   * @param setting {ISetting} - setting to be switched
   */
  changeBoolSetting(setting: ISetting) {
    console.log(setting);
    this.setSetting(setting, !setting.value);
  }

  /**
   * Returns string version of setting enum type since enums to work in templates
   * @param {ISetting} setting - setting to get type for
   * @returns {string} - setting type as string (e.g. "boolean", "number", "string")
   */
  getSettingType(setting: ISetting) {
    switch (setting.type) {
      case ESettingType.number: {
        return 'number';
      }
      case ESettingType.boolean: {
        return 'boolean';
      }
      case ESettingType.string_radio: {
        return 'radio';
      }
      case ESettingType.number_radio: {
        return 'radio';
      }
      case ESettingType.checkbox: {
        return 'checkbox';
      }
      case ESettingType.placeholder: {
        return 'placeholder';
      }
      default: {
        return 'string';
      }
    }
  }

}
