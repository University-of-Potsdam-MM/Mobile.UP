import { Injectable } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { Device } from '@capacitor/device';

/**
 * @type {IDeviceInfo}
 */
export interface IDeviceInfo {
  appVersion?: string;
  osPlatform?: string;
  osVersion?: string;
  uuid?: string;
  deviceManufacturer?: string;
  deviceModel?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  deviceInfo: IDeviceInfo;

  /**
   * @constructor
   * @param {Device} device
   * @param {Storage} storage
   * @param {Platform} platform
   */
  constructor() {}

  /**
   * @name getDeviceInfo
   * @description get information about the device
   */
  async getDeviceInfo(): Promise<IDeviceInfo> {
    const info = await Device.getInfo();
    const uid = await Device.getId();
    this.deviceInfo = {
      appVersion: ConfigService.config.appVersion,
      osPlatform: info.platform,
      osVersion: info.osVersion,
      uuid: uid.uuid,
      deviceManufacturer: info.manufacturer,
      deviceModel: info.model,
    };

    return this.deviceInfo;
  }
}
