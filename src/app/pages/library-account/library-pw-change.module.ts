import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
// import { Logger, LoggingService } from 'ionic-logging-service';
import { Storage } from '@capacitor/storage';
import { ModalController } from '@ionic/angular';
import { IBibSession } from 'src/app/lib/interfaces';
import { AlertService } from 'src/app/services/alert/alert.service';

@Component({
  selector: 'library-pw-change-modal-page',
  templateUrl: './library-pw-change.modal.html',
})
export class LibraryPwChangePage implements OnInit {
  @Input() header;
  @Input() endpoint;
  changeForm: FormGroup;
  // logger: Logger;
  pwVisibility = 'password';

  constructor(
    private modalCtrl: ModalController,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private alertService: AlertService // private loggingService: LoggingService
  ) {}

  ngOnInit() {
    // this.logger = this.loggingService.getLogger('[/library-pw-change]');

    this.changeForm = this.formBuilder.group(
      {
        oldPassword: ['', [Validators.required, Validators.minLength(2)]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(12),
            Validators.pattern(/^(?=.*[a-z])(?=.*\d)[A-Za-z\d-+_;:?]{8,12}$/),
          ],
        ],
        newPasswordVerify: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(12),
            Validators.pattern(/^(?=.*[a-z])(?=.*\d)[A-Za-z\d-+_;:?]{8,12}$/),
          ],
        ],
      },
      { validators: this.passwordsMustMatch }
    );
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  passwordsMustMatch: ValidatorFn = (
    control: FormGroup
  ): ValidationErrors | null => {
    const newP = control.get('newPassword');
    const newVerify = control.get('newPasswordVerify');

    return newP && newVerify && newP.value === newVerify.value
      ? null
      : { passwordsDiffer: true };
  };

  async changePassword() {
    const bibObj = await Storage.get({ key: 'bibSession' });
    const bibSession: IBibSession = JSON.parse(bibObj.value);

    const body = {
      patron: bibSession.oidcTokenObject.patron,
      username: bibSession.oidcTokenObject.patron,
      old_password: this.changeForm.value.oldPassword,
      new_password: this.changeForm.value.newPassword,
    };

    const pwHeaders = new HttpHeaders().append(
      'Authorization',
      'Bearer ' + bibSession.token
    );

    this.http
      .post(this.endpoint + 'auth/change', body, { headers: pwHeaders })
      .subscribe(
        () => {
          bibSession.credentials.password = this.changeForm.value.newPassword;
          Storage.set({
            key: 'bibSession',
            value: JSON.stringify(bibSession),
          }).then(() => {
            this.modalCtrl.dismiss({ shouldRelogin: true });
          });
        },
        (error) => {
          // this.logger.error(error);
          this.alertService.showToast('hints.text.failedPasswordChange');
        }
      );
  }

  togglePwVisibility() {
    if (this.pwVisibility === 'password') {
      this.pwVisibility = 'text';
    } else {
      this.pwVisibility = 'password';
    }
  }
}
