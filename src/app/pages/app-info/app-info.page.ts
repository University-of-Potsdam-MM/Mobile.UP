import { Component, OnInit } from '@angular/core';
import { NavigatorService } from 'src/app/services/navigator/navigator.service';
import { DeviceService, IDeviceInfo } from 'src/app/services/device/device.service';

@Component({
  selector: 'app-app-info',
  templateUrl: './app-info.page.html',
  styleUrls: ['./app-info.page.scss'],
})
export class AppInfoPage implements OnInit {

  showSysInfo = false;
  showParticipationInfo = false;
  showLibraryInfo = false;
  showContactPerson = false;

  deviceInfo: IDeviceInfo;

  constructor(
    private mapsProvider: NavigatorService,
    private deviceService: DeviceService
  ) { }

  ngOnInit() {
    this.deviceInfo = this.deviceService.getDeviceInfo();
  }

  callMap(location: string) {
    this.mapsProvider.navigateToAdress(location);
  }

}
