import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Device } from '@ionic-native/device/ngx';
import { Storage } from '@ionic/storage';

/**
 * @type {IDeviceInfo}
 */
export interface IDeviceInfo {
  cordovaVersion?: string;
  appVersion?: string;
  osPlatform?: string;
  osVersion?: string;
  uuid?: string;
  deviceManufacturer?: string;
  deviceModel?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  deviceInfo: IDeviceInfo;

  /**
   * @constructor
   * @param {Device} device
   * @param {Storage} storage
   * @param {Platform} platform
   */
  constructor(private device: Device,
              private storage: Storage,
              private platform: Platform) {
  }

  /**
   * @name getDeviceInfo
   * @description get information about the device
   */
  getDeviceInfo(): IDeviceInfo {
    if (this.platform.is('cordova')) {
      this.deviceInfo = {
        cordovaVersion: this.device.cordova,
        appVersion: undefined,
        osPlatform: this.device.platform,
        osVersion: this.device.version,
        uuid: this.device.uuid,
        deviceManufacturer: this.device.manufacturer,
        deviceModel: this.device.model
      };

      this.storage.get('appVersion').then(version => {
        this.deviceInfo.appVersion = version;
      });
      return this.deviceInfo;
    } else { return null; }
  }
}
