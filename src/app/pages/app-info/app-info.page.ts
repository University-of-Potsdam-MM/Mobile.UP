import { Component, OnInit } from '@angular/core';
import { NavigatorService } from 'src/app/services/navigator/navigator.service';
import { DeviceService, IDeviceInfo } from 'src/app/services/device/device.service';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { EmailComposer } from '@ionic-native/email-composer/ngx';
import { File } from '@ionic-native/file/ngx';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { UserSessionService } from 'src/app/services/user-session/user-session.service';
import { IOIDCUserInformationResponse } from 'src/app/services/login-provider/interfaces';

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

  constructor(
    private mapsProvider: NavigatorService,
    private deviceService: DeviceService,
    private file: File,
    private emailComposer: EmailComposer,
    private platform: Platform,
    private storage: Storage,
    private userSession: UserSessionService
  ) {
    super();
  }

  ngOnInit() {
    this.deviceInfo = this.deviceService.getDeviceInfo();
  }

  callMap(location: string) {
    this.mapsProvider.navigateToAdress(location);
  }

  async exportLog() {
    if (this.platform.is('cordova')) {
      const deviceInfo = this.deviceService.getDeviceInfo();
      deviceInfo.appVersion = await this.storage.get('appVersion');
      const userInformation: IOIDCUserInformationResponse = await this.userSession.getUserInfo();
      const body = JSON.stringify(deviceInfo);
      let subject = 'Log Export (' + new Date().toLocaleString() + ')';
      if (userInformation) { subject = userInformation.name + ': ' + subject; }

      this.file.writeFile(this.file.cacheDirectory, 'log.txt', localStorage.getItem('localLogStorage'), { replace: true })
        .then(response => {
          this.logger.debug('exportLog', response);
          const email = {
            to: 'mobileup-service@uni-potsdam.de',
            attachments: [ this.file.cacheDirectory + 'log.txt' ],
            body: body,
            subject: subject,
            isHtml: true
          };

          this.emailComposer.open(email).then(res => this.logger.debug('exportLog', res),
            error => this.logger.error('exportLog', 'open email', error));
        }, error => this.logger.error('exportLog', 'write file', error));
    } else { console.log(JSON.parse(localStorage.getItem('localLogStorage'))); }
  }

}
