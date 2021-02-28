import { Component, Input, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import {
  FormGroup,
  FormBuilder,
  Validators,
  ValidatorFn,
  ValidationErrors,
} from "@angular/forms";
import { HttpHeaders, HttpClient } from "@angular/common/http";
import { Storage } from "@ionic/storage";
import { IBibSession } from "src/app/lib/interfaces";
import { AlertService } from "src/app/services/alert/alert.service";
import { Logger, LoggingService } from "ionic-logging-service";

@Component({
  selector: "library-pw-change-modal-page",
  templateUrl: "./library-pw-change.modal.html",
})
export class LibraryPwChangePage implements OnInit {
  @Input() header;
  @Input() endpoint;
  changeForm: FormGroup;
  logger: Logger;
  pwVisibility = "password";

  constructor(
    private modalCtrl: ModalController,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private storage: Storage,
    private alertService: AlertService,
    private loggingService: LoggingService
  ) {}

  ngOnInit() {
    this.logger = this.loggingService.getLogger("[/library-pw-change]");

    this.changeForm = this.formBuilder.group(
      {
        oldPassword: ["", [Validators.required, Validators.minLength(2)]],
        newPassword: [
          "",
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(12),
            Validators.pattern(/^(?=.*[a-z])(?=.*\d)[A-Za-z\d-+_;:?]{8,12}$/),
          ],
        ],
        newPasswordVerify: [
          "",
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
    const newP = control.get("newPassword");
    const newVerify = control.get("newPasswordVerify");

    return newP && newVerify && newP.value === newVerify.value
      ? null
      : { passwordsDiffer: true };
  };

  async changePassword() {
    const bibSession: IBibSession = await this.storage.get("bibSession");

    const body = {
      patron: bibSession.oidcTokenObject.patron,
      username: bibSession.oidcTokenObject.patron,
      old_password: this.changeForm.value.oldPassword,
      new_password: this.changeForm.value.newPassword,
    };

    const headers = new HttpHeaders().append(
      "Authorization",
      "Bearer " + bibSession.token
    );

    this.http
      .post(this.endpoint + "auth/change", body, { headers: headers })
      .subscribe(
        (response) => {
          bibSession.credentials.password = this.changeForm.value.newPassword;
          this.storage.set("bibSession", bibSession).then(() => {
            this.modalCtrl.dismiss({ shouldRelogin: true });
          });
        },
        (error) => {
          this.logger.error(error);
          this.alertService.showToast("hints.text.failedPasswordChange");
        }
      );
  }

  togglePwVisibility() {
    if (this.pwVisibility == "password") {
      this.pwVisibility = "text";
    } else {
      this.pwVisibility = "password";
    }
  }
}
