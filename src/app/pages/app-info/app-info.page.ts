import { Component, OnInit } from '@angular/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AbstractPage } from 'src/app/lib/abstract-page';
import {
  DeviceService,
  IDeviceInfo,
} from 'src/app/services/device/device.service';
import { NavigatorService } from 'src/app/services/navigator/navigator.service';
import { default as packageJson } from '../../../../package.json';

@Component({
  selector: 'app-app-info',
  templateUrl: './app-info.page.html',
  styleUrls: ['./app-info.page.scss'],
})
export class AppInfoPage extends AbstractPage implements OnInit {
  showSysInfo = false;
  showParticipationInfo = false;
  showLibraryInfo = false;
  showContactPerson = false;

  deviceInfo: IDeviceInfo;
  dependencies;

  constructor(
    private navigator: NavigatorService,
    private deviceService: DeviceService
  ) {
    super();
  }

  async ngOnInit() {
    this.deviceInfo = await this.deviceService.getDeviceInfo();
    this.dependencies = Object.keys(packageJson.dependencies).map((dep) => ({
      name: dep,
      version: packageJson.dependencies[dep],
    }));
  }

  navigateToInstitut() {
    const address = 'An der Bahn 2, 14476 Potsdam';

    this.navigator.navigateToAddress(address);
  }

  async exportLog() {
    if (this.platform.is('ios') || this.platform.is('android')) {
      const deviceInfo = await this.deviceService.getDeviceInfo();
      const bodyLog = JSON.stringify(deviceInfo);
      const subjectLog = 'Log Export (' + new Date().toLocaleString() + ')';

      const writenFile = await Filesystem.writeFile({
        path: 'logs/log.txt',
        data: localStorage.getItem('localLogStorage'),
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });

      await Share.share({
        title: subjectLog,
        text: bodyLog,
        url: writenFile.uri,
      });
    } else {
      console.log(JSON.parse(localStorage.getItem('localLogStorage')));
    }
  }
}
