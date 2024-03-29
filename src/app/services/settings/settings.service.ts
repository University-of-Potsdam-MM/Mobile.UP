import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { ESettingType, ISetting } from '../../lib/interfaces';
import * as Constants from './settings_config';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  constructor() {}

  async getSettingValue(key: string) {
    const settingObj = await Preferences.get({ key: 'settings.' + key });
    const setting: ISetting = JSON.parse(settingObj.value);

    if (setting === null) {
      // if no user choice is set, try finding default value if setting exist
      const settings = Constants.SETTINGS;

      for (const settingsKey of settings) {
        if (settingsKey.key === key) {
          return settingsKey.value;
        }
      }

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
}
