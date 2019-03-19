import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IFeedback } from 'src/app/lib/interfaces';
import { DeviceService, IDeviceInfo } from 'src/app/services/device/device.service';
import { ConnectionService } from 'src/app/services/connection/connection.service';
import { ConfigService } from 'src/app/services/config/config.service';
import { UserSessionService } from 'src/app/services/user-session/user-session.service';
import { AlertService } from 'src/app/services/alert/alert.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.page.html',
  styleUrls: ['./feedback.page.scss'],
})
export class FeedbackPage implements OnInit {

  private form: FormGroup;
  loggedIn = false;
  deviceInfo: IDeviceInfo;
  feedback: IFeedback = {};
  session;

  /**
   * @constructor
   * @param {HttpClient} http
   * @param {NavController} navCtrl
   * @param {ConnectionProvider} connection
   * @param {SessionProvider} sessionProvider
   * @param {DeviceService} DeviceService
   * @param {FormBuilder} formBuilder
   */
  constructor(
    public http: HttpClient,
    public navCtrl: NavController,
    private connection: ConnectionService,
    private sessionProvider: UserSessionService,
    private deviceService: DeviceService,
    private formBuilder: FormBuilder,
    private alert: AlertService,
    private translate: TranslateService
  ) {
      this.form = this.formBuilder.group({
        rating: ['', Validators.required], // , Validators.required
        description: [''],
        recommend: ['', Validators.required],
        anonymous: ['true', Validators.required],
      });

  }

  /**
   * @async
   * @name ionViewWillEnter
   */
  async ionViewWillEnter() {
    this.connection.checkOnline(true, true);
    const session = await this.sessionProvider.getSession();

    if (session) {
      this.session = session;
      this.loggedIn = true;
    }
  }

  ngOnInit() {
    this.deviceInfo = this.deviceService.getDeviceInfo();
  }

  /**
   * @async
   * @name submitForm
   * @description submitForm
   */
  async submitForm() {
    if (this.deviceInfo) {
      this.feedback = {
        cordovaVersion: this.deviceInfo.cordovaVersion,
        appVersion: this.deviceInfo.appVersion,
        osPlatform: this.deviceInfo.osPlatform,
        osVersion: this.deviceInfo.osVersion,
        uuid: this.deviceInfo.uuid,
        deviceManufacturer: this.deviceInfo.deviceManufacturer,
        deviceModel: this.deviceInfo.deviceModel
      };
    }

    this.feedback.rating = this.form.value.rating;
    this.feedback.description = this.form.value.description;
    this.feedback.recommend = this.form.value.recommend;

    if (this.loggedIn && this.form.value.anonymous) {
      this.feedback.uid = this.session.credentials.username;
    }

    this.postFeedback();
  }

  /**
   * @name postFeedback
   */
  postFeedback() {

    const headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': ConfigService.config.webservices.apiToken
    });

    const request: IFeedback = this.feedback;

    this.http.post<IFeedback>(
      ConfigService.config.webservices.endpoint.feedback,
      request,
      {headers: headers}
    ).subscribe(
      (response) => {
        console.log(response);
        this.alert.presentToast(this.translate.instant('alert.feedback-sent'));
      },
      (error) => {
        console.log(error);
        this.alert.presentToast(this.translate.instant('alert.feedback-fail'));
      }
    );
  }
}
