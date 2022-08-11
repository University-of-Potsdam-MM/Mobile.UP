import { Component, OnInit } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { TranslateService } from '@ngx-translate/core';
import { default as moment } from 'moment';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { ESettingType, ISetting } from 'src/app/lib/interfaces';
import * as Constants from '../../services/settings/settings_config';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage extends AbstractPage implements OnInit {
  settings: Array<ISetting> = [];
  settings_initializes = false;

  constructor(private translate: TranslateService) {
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
   *
   * @returns {Promise<void>}
   */
  async loadInitialSettings() {
    for (const sett of this.settings) {
      const val = await this.getSettingValue(sett.key);
      if (val != null) {
        sett.value = val;
        // this.logger.debug('loadInitialSettings', 'loaded value for ', sett);
      }
    }
  }

  /**
   * Returns value of setting in usable format (bool as bool, number as number, string as string)
   *
   * @param key - key of setting to get
   * @returns {Promise<any>}
   */
  public async getSettingValue(key) {
    const settingObj = await Preferences.get({ key: 'settings.' + key });
    const setting: ISetting = JSON.parse(settingObj.value);
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

  customAlertOptions(setting) {
    const value = this.translate.instant(
      'page.settings.setting.' + setting.key
    );
    let infoText = '';
    if (value.info) {
      infoText = value.info;
    }
    return {
      message: infoText,
      backdropDismiss: false,
    };
  }

  setIonSelectSetting(event, setting) {
    const newValue = event.detail.value;
    this.setSetting(setting, newValue);
  }

  getOptionLabel(setting, option) {
    const value = this.translate.instant(
      'page.settings.setting.' + setting.key
    );
    if (value.options) {
      if (value.options[option.key] == null) {
        return option.key;
      } else {
        return value.options[option.key];
      }
    } else {
      return option.key;
    }
  }

  /**
   * Set setting value and save it
   *
   * @param setting {ISetting} - setting
   * @param value - value to set for setting
   * @returns {Promise<void>}
   */
  async setSetting(setting: ISetting, value) {
    // mainly so the boolean setting does not get caught in a onChange loop by loading/setting/change/change/..
    if (!this.settings_initializes) {
      // this.logger.debug('setSettings', 'prevented save before load');
      return false;
    }
    setting.value = value;
    // this.logger.debug('saveSettings', 'saved setting', setting, value);

    await Preferences.set({
      key: 'settings.' + setting.key,
      value: JSON.stringify(setting),
    });

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
   *
   * @param setting {ISetting} - setting to be switched
   */
  changeBoolSetting(setting: ISetting) {
    this.setSetting(setting, !setting.value);
  }

  /**
   * Returns string version of setting enum type since enums to work in templates
   *
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
