import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ModalController } from '@ionic/angular';
import { AlertButton } from '@ionic/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { AppComponent } from 'src/app/app.component';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { AlertService } from 'src/app/services/alert/alert.service';
import { ConfigService } from 'src/app/services/config/config.service';
import { ConnectionService } from 'src/app/services/connection/connection.service';
import {
  ELoginErrors,
  ICredentials,
  ISession,
} from 'src/app/services/login-service/interfaces';
import { UPLoginProvider } from 'src/app/services/login-service/login';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage extends AbstractPage {
  loading;
  loginForm: FormGroup;

  // This object will hold the data the user enters in the login form
  loginCredentials: ICredentials = {
    username: '',
    password: '',
  };

  constructor(
    private loadingCtrl: LoadingController,
    private translate: TranslateService,
    private upLogin: UPLoginProvider,
    private app: AppComponent,
    private modalCtrl: ModalController,
    private formBuilder: FormBuilder,
    private connectionService: ConnectionService,
    private alertService: AlertService
  ) {
    super({ requireNetwork: true });
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  /**
   * @async
   * @name login
   * @description Uses AuthServiceProvider to execute login. If login is successful the user
   * is taken back to the previous page. If not, an alert is shown.
   */
  public async login() {
    if (this.loginForm.valid) {
      this.loginCredentials.username = this.loginForm.controls.username.value;
      this.loginCredentials.password = this.loginForm.controls.password.value;

      this.showLoading();

      const oidcObject = ConfigService.config.authorization.oidc;

      // prepare Observable for use in switch
      const session: Observable<ISession> = this.upLogin.oidcLogin(
        this.autoCorrectUsername(this.loginCredentials),
        oidcObject
      );

      if (session) {
        // now handle the Observable which hopefully contains a session
        session.subscribe(
          (sessionRes: any) => {
            // this.logger.debug(
            //   'login',
            //   `successfully executed. Token: ${sessionRes.token}`
            // );
            this.sessionProvider.setSession(sessionRes).then(
              () => {
                // this.logger.debug('login', 'successfully saved login token');
              },
              (error) => {
                // this.logger.error('login', 'error saving login token', error);
                this.showAlert(ELoginErrors.UNKNOWN_ERROR);
              }
            );

            this.endLoading();

            setTimeout(() => {
              this.app.updateLoginStatus();
              this.modalCtrl.dismiss({ success: true }).then(undefined, () => {
                this.navCtrl.navigateRoot('/home');
              });
            }, 1000);
          },
          (error) => {
            // this.logger.error('login', 'getting session', error);
            this.endLoading();
            this.showAlert(error.reason);
          }
        );
      } else {
        this.showAlert(ELoginErrors.UNKNOWN_ERROR);
        // this.logger.error('login', 'no session passed by login-provider');
      }
    }
  }

  /**
   * @name autoCorrectUsername
   * @param {ICredentials} loginCredentials
   */
  autoCorrectUsername(loginCredentials: ICredentials) {
    // removes everything after (and including) @ in the username
    const foundAt = loginCredentials.username.indexOf('@');
    if (foundAt !== -1) {
      loginCredentials.username = loginCredentials.username.substring(
        0,
        foundAt
      );
      this.loginCredentials.username = loginCredentials.username;
    }

    return loginCredentials;
  }

  /**
   * @name showLoading
   * @description shows a loading animation
   */
  async showLoading() {
    this.loading = await this.loadingCtrl.create({
      message: this.translate.instant('page.login.loginInProgress'),
      spinner: 'crescent',
    });
    this.loading.present();
  }

  setPassword($event) {
    this.loginForm.controls.password.setValue($event.target.value);
  }

  setUsername($event) {
    this.loginForm.controls.username.setValue($event.target.value);
  }

  /**
   * @name showAlert
   * @param errorCode
   */
  async showAlert(errorCode: ELoginErrors) {
    if (!(await this.connectionService.checkOnline())) {
      this.alertService.showToast('alert.noInternetConnection');
    } else if (errorCode !== 0) {
      this.alertService.showToast('alert.httpErrorStatus.generic');
    } else {
      const buttons: AlertButton[] = [
        { text: this.translate.instant('button.continue') },
      ];
      this.alertService.showAlert(
        {
          headerI18nKey: 'alert.title.error',
          messageI18nKey: `page.login.loginError.${errorCode}`,
        },
        buttons
      );
    }
  }

  public abort() {
    this.modalCtrl.dismiss({ success: false }).then(undefined, () => {
      // this.logger.debug('abort', 'no overlay, using navCtrl');
      this.navCtrl.navigateRoot('/home');
    });
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
}
