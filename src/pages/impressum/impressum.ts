import {
  Component
} from '@angular/core';
import {
  IonicPage,
  NavController,
  NavParams,
  Platform
} from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { LegalNoticePage } from '../legal-notice/legal-notice';
import { PrivacyPolicyPage } from '../privacy-policy/privacy-policy';
import { TermsOfUsePage } from '../terms-of-use/terms-of-use';
import { IConfig } from '../../library/interfaces';
import { Device } from '@ionic-native/device';
import { AppVersion } from '@ionic-native/app-version';

@IonicPage()
@Component({
  selector: 'page-impressum',
  templateUrl: 'impressum.html',
})
export class ImpressumPage {

  config;
  showSysInfo = false;

  deviceInfo = {
    "cordovaVersion": undefined,
    "appVersion": undefined,
    "osPlatform": undefined,
    "osVersion": undefined,
    "uuid": undefined,
    "deviceManufacturer": undefined,
    "deviceModel": undefined
  }

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private device: Device,
    private appVersion: AppVersion,
    private platform: Platform,
    private storage: Storage) {}

    ngOnInit() {
      this.storage.get("config").then((config:IConfig) => {
        this.config = config;
      });

      if (this.platform.is("cordova")) {
        this.getDeviceInfo();
      }
    }

    openPage(page) {
      if (page == "LegalNoticePage") {
        this.navCtrl.push(LegalNoticePage, { 'config': this.config });
      } else if (page == "PrivacyPolicyPage") {
        this.navCtrl.push(PrivacyPolicyPage, { 'config': this.config });
      } else {
        this.navCtrl.push(TermsOfUsePage, { 'config': this.config });
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
}
