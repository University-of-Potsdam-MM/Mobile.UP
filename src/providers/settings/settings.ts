import {Injectable} from '@angular/core';
import {Storage} from "@ionic/storage";
import {ESettingType, ISetting} from "../../library/interfaces";
import * as Constants from "../../pages/settings/setting_config";

@Injectable()
export class SettingsProvider {

  constructor(private storage: Storage) {
    // console.log('Settings Provider initialized');
  }

  /**
   * Get Setting for given key, returns config default if no user choice is set
   * @param key - setting key
   * @returns {any} Setting value or null if key is not found
   */
  public async getSettingValue(key) {
    let setting: ISetting = await this.storage.get("settings." + key);

    if (setting == null) {
      // if no user choice is set, try finding default value if setting exist
      let settings = Constants.SETTINGS;

      for(let i = 0; i < settings.length; i++){
        if(settings[i].key == key){
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

}
