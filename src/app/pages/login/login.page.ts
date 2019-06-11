import { Component } from '@angular/core';
import { Events, LoadingController, ModalController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ICredentials, ISession, IOIDCUserInformationResponse, ELoginErrors } from 'src/app/services/login-provider/interfaces';
import { UPLoginProvider } from 'src/app/services/login-provider/login';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { AlertService } from 'src/app/services/alert/alert.service';
import { AlertButton } from '@ionic/core';

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
    password: ''
  };

  constructor(
    private loadingCtrl: LoadingController,
    private translate: TranslateService,
    private upLogin: UPLoginProvider,
    private events: Events,
    private modalCtrl: ModalController,
    private formBuilder: FormBuilder,
    private alertService: AlertService
  ) {
    super({ requireNetwork: true });
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
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

      this.loginCredentials.username = this.loginForm.controls['username'].value;
      this.loginCredentials.password = this.loginForm.controls['password'].value;

      this.showLoading();

      // prepare Observable for use in switch
      const session: Observable<ISession> = this.upLogin.oidcLogin(
        this.autoCorrectUsername(this.loginCredentials),
        this.config.authorization.oidc
      );

      if (session) {
        // now handle the Observable which hopefully contains a session
        session.subscribe(
          (sessionRes: any) => {
            this.logger.debug('login', `successfully executed. Token: ${sessionRes.token}`);
            this.sessionProvider.setSession(sessionRes);

            this.endLoading();

            // in the meantime get user information and save it to storage
            this.upLogin.oidcGetUserInformation(sessionRes, this.config.authorization.oidc).subscribe(
              (userInformation: IOIDCUserInformationResponse) => {
                this.sessionProvider.setUserInfo(userInformation);
              }, error => {
                // user must not know if something goes wrong here, so we don't
                // create an alert
                this.logger.error('login', 'oidcGetUserInformation', error);
              }
            );

            setTimeout(() => {
              this.events.publish('userLogin');
              this.modalCtrl.dismiss({ 'success': true }).then(() => {}, () => {
                this.navCtrl.navigateRoot('/home');
              });
            }, 1000);
          }, error => {
            this.logger.error('login', 'getting session', error);
            this.endLoading();
            this.showAlert(error.reason);
          }
        );
      } else {
        this.showAlert(ELoginErrors.UNKNOWN_ERROR);
        this.logger.error('login', 'no session passed by login-provider');
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
      loginCredentials.username = loginCredentials.username.substring(0, foundAt);
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
      spinner: 'crescent'
    });
    this.loading.present();
  }

  /**
   * @name endLoading
   * @description ends the loading animation
   */
  private endLoading(): void {
    this.loading.dismiss();
  }

  /**
   * @name showAlert
   * @param errorCode
   */
  showAlert(errorCode: ELoginErrors) {
    const buttons: AlertButton[] = [{ text: this.translate.instant('button.continue') }];
    this.alertService.showAlert(
      {
        headerI18nKey: 'alert.title.error',
        messageI18nKey: `page.login.loginError.${errorCode}`
      },
      buttons
    );
  }

  public abort() {
    this.modalCtrl.dismiss({ 'success': false }).then(() => {}, () => {
      this.logger.debug('abort', 'no overlay, using navCtrl');
      this.navCtrl.navigateRoot('/home');
    });
  }

}
