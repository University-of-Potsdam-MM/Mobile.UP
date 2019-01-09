import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { Device } from "@ionic-native/device";
import { AppVersion } from "@ionic-native/app-version";
import { MapsProvider } from '../../providers/maps/maps';

@IonicPage()
@Component({
  selector: 'page-app-info',
  templateUrl: 'app-info.html',
})
export class AppInfoPage {

  showSysInfo = false;
  showParticipationInfo = false;
  showLibraryInfo = false;
  showContactPerson = false;

  deviceInfo = {
    "cordovaVersion": undefined,
    "appVersion": undefined,
    "osPlatform": undefined,
    "osVersion": undefined,
    "uuid": undefined,
    "deviceManufacturer": undefined,
    "deviceModel": undefined
  }

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private device: Device,
              private mapsProvider: MapsProvider,
              private platform: Platform,
              private appVersion: AppVersion) {
  }

  ngOnInit() {
    if (this.platform.is("cordova")) {
      this.getDeviceInfo();
    }
  }

  getDeviceInfo() {
    this.deviceInfo = {
      "cordovaVersion": this.device.cordova,
      "appVersion": undefined,
      "osPlatform": this.device.platform,
      "osVersion": this.device.version,
      "uuid": this.device.uuid,
      "deviceManufacturer": this.device.manufacturer,
      "deviceModel": this.device.model
    }

    this.appVersion.getVersionNumber().then(number => {
      this.deviceInfo.appVersion = number;

      this.appVersion.getVersionCode().then(code => {
        this.deviceInfo.appVersion += " (" + code + ")";
      });
    });
  }

  callMap(location:string) {
    this.mapsProvider.navigateToAdress(location);
  }
}