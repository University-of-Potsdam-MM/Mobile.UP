import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { IFeedback } from 'src/app/lib/interfaces';
import { DeviceService, IDeviceInfo } from 'src/app/services/device/device.service';
import { AlertService } from 'src/app/services/alert/alert.service';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';
import { ConnectionService } from 'src/app/services/connection/connection.service';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.page.html',
  styleUrls: ['./feedback.page.scss'],
})
export class FeedbackPage extends AbstractPage implements OnInit {

  form: FormGroup;
  deviceInfo: IDeviceInfo;
  feedback: IFeedback = {};

  /**
   * @constructor
   * @param {NavController} navCtrl
   * @param {DeviceService} DeviceService
   * @param {FormBuilder} formBuilder
   */
  constructor(
    public navCtrl: NavController,
    private deviceService: DeviceService,
    private formBuilder: FormBuilder,
    private alertService: AlertService,
    private connectionService: ConnectionService,
    private ws: WebserviceWrapperService
  ) {
      super({ optionalNetwork: true, optionalSession: true });
      this.form = this.formBuilder.group({
        rating: ['', Validators.required], // , Validators.required
        description: [''],
        recommend: ['', Validators.required],
        anonymous: [false, Validators.required],
      });
  }

  ngOnInit() {
    this.deviceInfo = this.deviceService.getDeviceInfo();
  }

  /**
   * @name submitForm
   * @description submitForm
   */
  submitForm() {
    this.feedback = {};
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

    if (this.session && !this.form.value.anonymous) {
      this.feedback.uid = this.session.credentials.username;
    }

    this.postFeedback();
  }

  /**
   * @name postFeedback
   */
  postFeedback() {
    this.ws.call(
      'feedback',
      this.feedback
    ).subscribe(() => {
        this.alertService.showToast('alert.feedback-sent').then(() => {
          this.navCtrl.navigateBack('/home');
        });
      }, () => {
        if (!this.connectionService.checkOnline()) {
          this.alertService.showToast('alert.noInternetConnection');
        } else {
          this.alertService.showToast('alert.httpErrorStatus.generic');
        }
      }
    );
  }
}
