import { Component, OnInit } from '@angular/core';
import { AlertController, Events, LoadingController, ModalController, NavController } from '@ionic/angular';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ICredentials, ISession, IOIDCUserInformationResponse, ELoginErrors } from 'src/app/services/login-provider/interfaces';
import { UserSessionService } from 'src/app/services/user-session/user-session.service';
import { ConnectionService } from 'src/app/services/connection/connection.service';
import { UPLoginProvider } from 'src/app/services/login-provider/login';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  loading;
  alreadyLoggedIn: boolean;
  loginForm: FormGroup;

  // This object will hold the data the user enters in the login form
  loginCredentials: ICredentials = {
    username: '',
    password: ''
  };

  constructor(
    private userSession: UserSessionService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private translate: TranslateService,
    private connection: ConnectionService,
    private upLogin: UPLoginProvider,
    private navCtrl: NavController,
    private events: Events,
    private modalCtrl: ModalController,
    private formBuilder: FormBuilder
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  async ngOnInit() {
    this.connection.checkOnline(true, true);
    const session = await this.userSession.getSession();

    if (session) {
      this.alreadyLoggedIn = true;
    } else { this.alreadyLoggedIn = false; }
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
      const config = ConfigService.config;

      // prepare Observable for use in switch
      const session: Observable<ISession> = this.upLogin.oidcLogin(
        this.autoCorrectUsername(this.loginCredentials),
        config.authorization.oidc
      );

      if (session) {
        // now handle the Observable which hopefully contains a session
        session.subscribe(
          (sessionRes: any) => {
            console.log(`[LoginPage]: Login successfully executed. Token: ${sessionRes.token}`);
            this.userSession.setSession(sessionRes);

            this.endLoading();

            // in the meantime get user information and save it to storage
            this.upLogin.oidcGetUserInformation(sessionRes, config.authorization.oidc).subscribe(
              (userInformation: IOIDCUserInformationResponse) => {
                this.userSession.setUserInfo(userInformation);
              }, error => {
                // user must not know if something goes wrong here, so we don't
                // create an alert
                console.log(`[LoginPage]: Could not retrieve user information because:\n${JSON.stringify(error)}`);
              }
            );

            setTimeout(() => {
              this.events.publish('userLogin');
              this.modalCtrl.dismiss({ 'success': true }).then(() => {}, () => {
                console.log('[LoginPage]: no overlay, using navCtrl');
                this.navCtrl.navigateRoot('/home');
              });
            }, 1000);
          }, error => {
            console.log(error);
            this.endLoading();
            this.showAlert(error.reason);
          }
        );
      } else {
        this.showAlert(ELoginErrors.UNKNOWN_ERROR);
        console.log('[LoginPage]: Somehow no session has been passed by login-provider');
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
  async showAlert(errorCode: ELoginErrors) {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('alert.title.error'),
      message: this.translate.instant(`page.login.loginError.${errorCode}`),
      buttons: [ this.translate.instant('button.continue') ]
    });
    alert.present();
  }

  public abort() {
    this.modalCtrl.dismiss({ 'success': false }).then(() => {}, () => {
      console.log('[LoginPage]: no overlay, using navCtrl');
      this.navCtrl.navigateRoot('/home');
    });
  }

}
