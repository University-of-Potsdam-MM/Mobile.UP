import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ISession } from "../login-provider/interfaces";
import { Observable, ReplaySubject } from "rxjs";
import {
  IPulsApiRequest_getStudentCourses,
  IPulsAPIResponse_getStudentCourses
} from "../../library/interfaces_PULS";
import { ConfigProvider } from "../config/config";
import { LoginPage } from "../../pages/login/login";
import {
  AlertController,
  App,
} from "ionic-angular";
import { TranslateService } from "@ngx-translate/core";
import { SessionProvider } from '../session/session';

@Injectable()
export class PulsProvider {

  constructor(public http: HttpClient,
              private alertCtrl: AlertController,
              private translate: TranslateService,
              private sessionProvider: SessionProvider,
              private app: App) {
  }

  public getStudentCourses(session:ISession):Observable<IPulsAPIResponse_getStudentCourses> {

    let headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': ConfigProvider.config.webservices.apiToken
    });

    let request:IPulsApiRequest_getStudentCourses = {
      condition:{
        semester: 0,
        allLectures: 0
      },
      // TODO: refactor this someday so credentials are not used
      'user-auth': {
        username: session.credentials.username,
        password: session.credentials.password
      }
    };

    let rs = new ReplaySubject<IPulsAPIResponse_getStudentCourses>();

    // TODO: check for connection first!
    this.http.post<IPulsAPIResponse_getStudentCourses>(
      ConfigProvider.config.webservices.endpoint.puls+"getStudentCourses",
      request,
      {headers: headers}
    ).subscribe(
      (response:IPulsAPIResponse_getStudentCourses) => {
        // PULS simply responds with "no user rights" if credentials are incorrect
        if(response.message == "no user rights") {
          // we're having a contradiction here, the password is wrong, but
          // the token is still valid. We'll log the user out and send the
          // user to LoginPage

          rs.next(response);
          // this.handleSpecialCase();
          // this does not necessarily mean that the password is wrong
          // the elistest account f.e. just does not support the grades / timetable functions
          // should not log out
        } else {
          rs.next(response);
        }
      },
      error => {

      }
    );

    return rs;
  }

  /**
   * handles special case as described in #81
   */
  public handleSpecialCase() {
    this.sessionProvider.removeSession();
    this.sessionProvider.removeUserInfo();
    let alert = this.alertCtrl.create({
      title: this.translate.instant("alert.title.error"),
      subTitle: this.translate.instant("alert.token_valid_credentials_invalid"),
      buttons: [ this.translate.instant("button.continue") ]
    });
    alert.present();
    this.app.getRootNav().push(LoginPage)
  }

}
