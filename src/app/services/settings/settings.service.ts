import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { ISetting, ESettingType } from '../../lib/interfaces';
import * as Constants from './settings_config';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  constructor(private storage: Storage) { }

  async getSettingValue(key: string) {
    const setting: ISetting = await this.storage.get('settings.' + key);

    if (setting === null) {
      // if no user choice is set, try finding default value if setting exist
      const settings = Constants.SETTINGS;

      for (let i = 0; i < settings.length; i++) {
        if (settings[i].key === key) {
          return settings[i].value;
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
        return setting.value === '1';
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
