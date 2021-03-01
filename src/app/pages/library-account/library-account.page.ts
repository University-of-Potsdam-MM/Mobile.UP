import { Component, OnInit } from "@angular/core";
import {
  IUBUser,
  IUBFees,
  IUBItems,
  IBibSessionResponse,
  IBibSession,
} from "src/app/lib/interfaces";
import { AbstractPage } from "src/app/lib/abstract-page";
import * as moment from "moment";
import { TranslateService } from "@ngx-translate/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ConfigService } from "../../services/config/config.service";
import {
  ICredentials,
  ELoginErrors,
} from "src/app/services/login-provider/interfaces";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { LoadingController, ModalController } from "@ionic/angular";
import { Storage } from "@ionic/storage";
import { AlertButton } from "@ionic/core";
import { AlertService } from "src/app/services/alert/alert.service";
import { LibraryPwChangePage } from "./library-pw-change.module";
import { sessionIsValid } from "src/app/lib/util";

@Component({
  selector: "app-library-account",
  templateUrl: "./library-account.page.html",
  styleUrls: ["./library-account.page.scss"],
})
export class LibraryAccountPage extends AbstractPage implements OnInit {
  user: IUBUser;
  fees: IUBFees;
  items: IUBItems;

  userLoaded;
  itemsLoaded;
  feesLoaded;
  feesExpanded = false;
  userExpanded = false;

  userError;
  itemsError;
  feesError;

  itemStatus = [];
  grayedOutItemsHintRenew;
  grayedOutItemsHintCancel;
  noLoanItems = true;
  noReservedItems = true;
  activeSegment = "loan";
  endpoint;

  // this object will hold the data the user enters in the login form
  loginCredentials: ICredentials = {
    username: "",
    password: "",
  };

  bibSession: IBibSession;
  loginForm: FormGroup;
  loading;
  showLoginScreen;
  modalOpen;

  constructor(
    private translate: TranslateService,
    private http: HttpClient,
    private loadingCtrl: LoadingController,
    private formBuilder: FormBuilder,
    private storage: Storage,
    private alertService: AlertService,
    private modalCtrl: ModalController
  ) {
    super({ requireNetwork: true });
    this.loginForm = this.formBuilder.group({
      username: ["", Validators.required],
      password: ["", Validators.required],
    });
  }

  async ngOnInit() {
    this.bibSession = await this.storage.get("bibSession");
    this.endpoint = ConfigService.config.webservices.endpoint.libraryPAIA.url;

    if (this.bibSession) {
      if (
        this.bibSession.timestamp &&
        this.bibSession.oidcTokenObject &&
        this.bibSession.oidcTokenObject.expires_in &&
        sessionIsValid(
          this.bibSession.timestamp,
          this.bibSession.oidcTokenObject.expires_in,
          600
        )
      ) {
        this.getUser();
        this.getItems();
        this.getFees();
      } else if (this.bibSession.credentials) {
        this.loginUB(this.bibSession.credentials);
      } else {
        this.logoutUB();
      }
    } else {
      this.showLoginScreen = true;
    }
  }

  loginUB(loginCredentials?: ICredentials) {
    if (this.loginForm.valid || loginCredentials) {
      if (!loginCredentials) {
        this.loginCredentials.username = this.loginForm.controls[
          "username"
        ].value;
        this.loginCredentials.password = this.loginForm.controls[
          "password"
        ].value;
        this.showLoading();
      } else {
        this.loginCredentials.username = loginCredentials.username;
        this.loginCredentials.password = loginCredentials.password;
      }

      const body = {
        username: this.loginCredentials.username,
        password: this.loginCredentials.password,
        grant_type: "password",
        scope:
          "read_patron read_fees read_items write_items change_password read_availability",
      };

      const headers = new HttpHeaders().append(
        "Authorization",
        ConfigService.config.webservices.apiToken
      );

      // const headersNew = new HttpHeaders()
      //   .append('apikey', ConfigService.config.webservices.apiTokenNew);

      this.http
        .get(this.endpoint + "auth/login", { params: body, headers: headers })
        .subscribe(
          (data: IBibSessionResponse) => {
            this.bibSession = {
              credentials: this.loginCredentials,
              token: data.access_token,
              oidcTokenObject: data,
              timestamp: new Date(),
            };

            this.storage.set("bibSession", this.bibSession);

            if (!loginCredentials) {
              this.endLoading();
            }

            this.getUser();
            this.getItems();
            this.getFees();
          },
          (error) => {
            this.logger.error("loginUB()", error);

            if (!loginCredentials) {
              this.endLoading();
            }

            this.showAlert(ELoginErrors.AUTHENTICATION);
            this.logoutUB();
          }
        );
    }
  }

  logoutUB() {
    this.bibSession = undefined;
    this.user = undefined;
    this.items = undefined;
    this.fees = undefined;
    this.grayedOutItemsHintRenew = false;
    this.grayedOutItemsHintCancel = false;
    this.userLoaded = false;
    this.itemsLoaded = false;
    this.feesLoaded = false;
    this.feesExpanded = false;
    this.userExpanded = false;
    this.noLoanItems = true;
    this.noReservedItems = true;
    this.activeSegment = "loan";
    this.itemStatus = [];
    this.showLoginScreen = true;

    this.loginCredentials = {
      username: "",
      password: "",
    };

    this.loginForm = this.formBuilder.group({
      username: ["", Validators.required],
      password: ["", Validators.required],
    });

    this.storage.remove("bibSession");
    this.logger.debug("logoutUB()", "successfully logged out ub-user");
  }

  getUser() {
    this.userLoaded = false;
    this.userError = false;

    const headers = new HttpHeaders().append(
      "Authorization",
      "Bearer " + this.bibSession.token
    );

    this.http
      .get(this.endpoint + "core/" + this.bibSession.oidcTokenObject.patron, {
        headers: headers,
      })
      .subscribe(
        (userData: IUBUser) => {
          this.user = userData;
          this.userLoaded = true;
        },
        (error) => {
          this.logger.error("getUser()", error);
          this.userLoaded = true;
          this.userError = true;
        }
      );
  }

  getItems() {
    this.itemsLoaded = false;
    this.itemsError = false;

    const headers = new HttpHeaders().append(
      "Authorization",
      "Bearer " + this.bibSession.token
    );

    this.http
      .get(
        this.endpoint +
          "core/" +
          this.bibSession.oidcTokenObject.patron +
          "/items",
        { headers: headers }
      )
      .subscribe(
        (itemData: IUBItems) => {
          this.items = itemData;
          this.items.doc.sort((a, b) => {
            if (a.endtime > b.endtime) {
              return 1;
            } else {
              return -1;
            }
          });
          this.itemsLoaded = true;
          this.prepareForm();
        },
        (error) => {
          this.logger.error("getItems()", error);
          this.itemsLoaded = true;
          this.itemsError = true;
        }
      );
  }

  getFees() {
    this.feesLoaded = false;
    this.feesError = false;

    const headers = new HttpHeaders().append(
      "Authorization",
      "Bearer " + this.bibSession.token
    );

    this.http
      .get(
        this.endpoint +
          "core/" +
          this.bibSession.oidcTokenObject.patron +
          "/fees",
        { headers: headers }
      )
      .subscribe(
        (feeData: IUBFees) => {
          this.fees = feeData;
          this.feesLoaded = true;
        },
        (error) => {
          this.logger.error("getFees()", error);
          this.feesLoaded = true;
          this.feesError = true;
        }
      );
  }

  refresh(refresher) {
    this.getUser();
    this.getItems();
    this.getFees();
    if (refresher && refresher.target) {
      refresher.target.complete();
    }
  }

  renewItems() {
    const docsToRenew: IUBItems = {
      doc: [],
    };

    if (this.items && this.items.doc) {
      for (let i = 0; i < this.items.doc.length; i++) {
        if (this.itemStatus[i] && this.itemStatus[i].isCheckedToRenew) {
          docsToRenew.doc.push(this.items.doc[i]);
        }
      }
    }

    this.renewRequest(docsToRenew);
  }

  renewRequest(items: IUBItems) {
    const headers = new HttpHeaders().append(
      "Authorization",
      "Bearer " + this.bibSession.token
    );

    this.http
      .post(
        this.endpoint +
          "core/" +
          this.bibSession.oidcTokenObject.patron +
          "/renew",
        items,
        { headers: headers }
      )
      .subscribe(
        () => {
          this.getItems();
        },
        (error) => {
          this.logger.error("renewRequest()", error);
          const buttons: AlertButton[] = [
            { text: this.translate.instant("button.continue") },
          ];
          this.alertService.showAlert(
            {
              headerI18nKey: "alert.title.error",
              messageI18nKey: "page.library-account.renewError",
            },
            buttons
          );
        }
      );
  }

  cancelItems() {
    const docsToCancel: IUBItems = {
      doc: [],
    };

    if (this.items && this.items.doc) {
      for (let i = 0; i < this.items.doc.length; i++) {
        if (this.itemStatus[i] && this.itemStatus[i].isCheckedToCancel) {
          docsToCancel.doc.push(this.items.doc[i]);
        }
      }
    }

    this.cancelRequest(docsToCancel);
  }

  cancelRequest(items: IUBItems) {
    const headers = new HttpHeaders().append(
      "Authorization",
      "Bearer " + this.bibSession.token
    );

    this.http
      .post(
        this.endpoint +
          "core/" +
          this.bibSession.oidcTokenObject.patron +
          "/cancel",
        items,
        { headers: headers }
      )
      .subscribe(
        () => {
          this.getItems();
        },
        (error) => {
          this.logger.error("cancelRequest()", error);
          const buttons: AlertButton[] = [
            { text: this.translate.instant("button.continue") },
          ];
          this.alertService.showAlert(
            {
              headerI18nKey: "alert.title.error",
              messageI18nKey: "page.library-account.cancelError",
            },
            buttons
          );
        }
      );
  }

  prepareForm() {
    // reset variables
    this.itemStatus = [];
    this.noReservedItems = true;
    this.noLoanItems = true;
    this.grayedOutItemsHintCancel = false;
    this.grayedOutItemsHintRenew = false;

    if (this.items && this.items.doc) {
      for (let i = 0; i < this.items.doc.length; i++) {
        if (this.items.doc[i].status === 1) {
          this.noReservedItems = false;
        }

        if (
          this.items.doc[i].status === 4 ||
          this.items.doc[i].status === 3 ||
          this.items.doc[i].status === 2
        ) {
          this.noLoanItems = false;
        }

        let renewable;
        if (this.items.doc[i].queue !== 0 || !this.items.doc[i].canrenew) {
          // item can not be renewed
          renewable = false;
        } else if (this.items.doc[i].canrenew) {
          renewable = true;
        }

        const canCancel = this.items.doc[i].cancancel;

        if (!this.items.doc[i].cancancel && this.items.doc[i].status === 1) {
          this.grayedOutItemsHintCancel = true;
        }

        if (
          !renewable &&
          (this.items.doc[i].status === 4 ||
            this.items.doc[i].status === 3 ||
            this.items.doc[i].status === 2)
        ) {
          this.grayedOutItemsHintRenew = true;
        }

        let endDate;
        if (this.items.doc[i].endtime) {
          endDate = moment(this.items.doc[i].endtime);
        }

        const currentDate = moment();
        let dayDiff = 0;
        if (endDate && currentDate) {
          dayDiff = endDate.diff(currentDate, "days");
        }

        let status;
        if (dayDiff < 0) {
          status = 2;
        } else if (dayDiff < 4) {
          status = 1;
        } else {
          status = 0;
        }

        this.itemStatus[i] = {
          isCheckedToRenew: false,
          isCheckedToCancel: false,
          canRenew: renewable,
          canCancel: canCancel,
          // status: 0 = ok, 1 = due soon, 2 = late
          status: status,
          daysToReturn: dayDiff,
        };
      }
    }
  }

  validateCheckboxesRenew() {
    let checked = false;
    for (const status of this.itemStatus) {
      if (status.isCheckedToRenew) {
        checked = true;
        break;
      }
    }

    return !checked;
  }

  validateCheckboxesCancel() {
    let checked = false;
    for (const status of this.itemStatus) {
      if (status.isCheckedToCancel) {
        checked = true;
        break;
      }
    }

    return !checked;
  }

  formatItemDates(date) {
    let tmp;
    if (this.translate.currentLang === "de") {
      tmp = moment(date).format("DD.MM.YYYY");
    } else {
      tmp = moment(date).format("L");
    }
    return tmp;
  }

  abort() {
    this.navCtrl.navigateBack("/home");
  }

  getAccountStatus(status) {
    const s = "page.library-account.status." + String(status).trim();
    return this.translate.instant(s);
  }

  /**
   * @name showLoading
   * @description shows a loading animation
   */
  async showLoading() {
    this.loading = await this.loadingCtrl.create({
      message: this.translate.instant("page.login.loginInProgress"),
      spinner: "crescent",
    });
    this.loading.present();
  }

  /**
   * @name endLoading
   * @description ends the loading animation
   */
  private endLoading(): void {
    if (this.loading) {
      this.loading.dismiss();
    } else {
      setTimeout(() => {
        this.endLoading();
      }, 250);
    }
  }

  /**
   * @name showAlert
   * @param errorCode
   */
  showAlert(errorCode: ELoginErrors) {
    const buttons: AlertButton[] = [
      { text: this.translate.instant("button.continue") },
    ];
    this.alertService.showAlert(
      {
        headerI18nKey: "alert.title.error",
        messageI18nKey: `page.library-account.loginError.${errorCode}`,
      },
      buttons
    );
  }

  formatDate(date) {
    const dateString = new Date(date).toLocaleDateString(
      this.translate.currentLang
    );
    return dateString;
  }

  async goToChangePassword() {
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: LibraryPwChangePage,
      componentProps: {
        header: this.translate.instant("page.library-account.changePassword"),
        endpoint: this.endpoint,
      },
    });
    modal.present();
    this.modalOpen = true;
    const response = await modal.onDidDismiss();
    if (response && response.data && response.data.shouldRelogin) {
      this.bibSession = await this.storage.get("bibSession");
      this.loginUB(this.bibSession.credentials);
      this.alertService.showToast("hints.text.changedPassword");
    }
    this.modalOpen = false;
  }
}
