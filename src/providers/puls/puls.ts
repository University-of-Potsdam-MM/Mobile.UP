import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ISession } from "../login-provider/interfaces";
import { Observable, ReplaySubject } from "rxjs";
import {
  IPulsApiRequest_getStudentCourses,
  IPulsAPIResponse_getStudentCourses,
  IPulsApiRequest_getLectureScheduleRoot,
  IPulsAPIResponse_getLectureScheduleRoot,
  IPulsApiRequest_getLectureScheduleSubTree,
  IPulsAPIResponse_getLectureScheduleSubTree,
  IPulsApiRequest_getLectureScheduleCourses,
  IPulsAPIResponse_getLectureScheduleCourses,
  IPulsApiRequest_getCourseData,
  IPulsAPIResponse_getCourseData,
  IPulsApiRequest_getPersonalStudyAreas,
  IPulsAPIResponse_getPersonalStudyAreas
} from "../../library/interfaces_PULS";
import { ConfigProvider } from "../config/config";
import { LoginPage } from "../../pages/login/login";
import {
  AlertController,
  App,
} from "ionic-angular";
import { TranslateService } from "@ngx-translate/core";
import { SessionProvider } from '../session/session';
import {AlertProvider} from "../alert/alert";

@Injectable()
export class PulsProvider {

  headers: HttpHeaders;

  constructor(public http: HttpClient,
              private alertCtrl: AlertController,
              private translate: TranslateService,
              private sessionProvider: SessionProvider,
              private app: App,
              private alertProvider: AlertProvider) {

    // set headers for all requests
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': ConfigProvider.config.webservices.apiToken
    });
  }


  /**
   * @name getLectureScheduleRoot
   */
  public getLectureScheduleRoot():Observable<IPulsAPIResponse_getLectureScheduleRoot> {

    let request:IPulsApiRequest_getLectureScheduleRoot = {condition:{semester: 0}};

    let rs = new ReplaySubject<IPulsAPIResponse_getLectureScheduleRoot>();

    this.http.post<IPulsAPIResponse_getLectureScheduleRoot>(
      ConfigProvider.config.webservices.endpoint.puls+'getLectureScheduleRoot', request, {headers: this.headers}).subscribe(
      (response:IPulsAPIResponse_getLectureScheduleRoot) => {
        rs.next(response);
      }
    );
    return rs;
  }


  /**
   * @name getLectureScheduleSubTree
   */
  public getLectureScheduleSubTree(headerId):Observable<IPulsAPIResponse_getLectureScheduleSubTree> {

    let request:IPulsApiRequest_getLectureScheduleSubTree = {condition:{headerId: headerId}};

    let rs = new ReplaySubject<IPulsAPIResponse_getLectureScheduleSubTree>();

    this.http.post<IPulsAPIResponse_getLectureScheduleSubTree>(
      ConfigProvider.config.webservices.endpoint.puls+'getLectureScheduleSubTree', request, {headers: this.headers}).subscribe(
      (response:IPulsAPIResponse_getLectureScheduleSubTree) => {
        rs.next(response);
      }
    );
    return rs;
  }

  /**
   * @name getLectureScheduleCourses
   */
  public getLectureScheduleCourses(headerId):Observable<IPulsAPIResponse_getLectureScheduleCourses> {

    let request:IPulsApiRequest_getLectureScheduleCourses = {condition:{headerId: headerId}};

    let rs = new ReplaySubject<IPulsAPIResponse_getLectureScheduleCourses>();

    this.http.post<IPulsAPIResponse_getLectureScheduleCourses>(
      ConfigProvider.config.webservices.endpoint.puls+'getLectureScheduleCourses', request, {headers: this.headers}).subscribe(
      (response:IPulsAPIResponse_getLectureScheduleCourses) => {
        rs.next(response);
      }
    );
    return rs;
  }

  /**
   * @name getCourseData
   */
  public getCourseData(courseId):Observable<IPulsAPIResponse_getCourseData> {

    let request:IPulsApiRequest_getCourseData = {condition:{courseId: courseId}};

    let rs = new ReplaySubject<IPulsAPIResponse_getCourseData>();

    this.http.post<IPulsAPIResponse_getCourseData>(
      ConfigProvider.config.webservices.endpoint.puls+'getCourseData', request, {headers: this.headers}).subscribe(
      (response:IPulsAPIResponse_getCourseData) => {
        rs.next(response);
      }
    );
    return rs;
  }


  /**
   * @name getPersonalStudyAreas
   * @param {ISession} session
   */
  public getPersonalStudyAreas(session:ISession):Observable<IPulsAPIResponse_getPersonalStudyAreas> {

    let request:IPulsApiRequest_getPersonalStudyAreas = {
      // TODO: refactor this someday so credentials are not used
      'user-auth': {
        username: session.credentials.username,
        password: session.credentials.password
      }
    };

    let rs = new ReplaySubject<IPulsAPIResponse_getPersonalStudyAreas>();

    // TODO: check for connection first!
    this.http.post<IPulsAPIResponse_getPersonalStudyAreas>(
      ConfigProvider.config.webservices.endpoint.puls+"getPersonalStudyAreas", request, {headers: this.headers}).subscribe(
      (response:IPulsAPIResponse_getPersonalStudyAreas) => {
        // PULS simply responds with "no user rights" if credentials are incorrect
        if(response.message == "no user rights") {

          // we're having a contradiction here, the password is wrong, but
          // the token is still valid  so we're having
          // case #81 here. We'll log the user out and send the
          // user to LoginPage

          // this does not necessarily mean that the password is wrong
          // the elistest account f.e. just does not support the grades / timetable functions
          // should not log out
          // this.puls.handleSpecialCase();

          rs.next(response);

          this.alertProvider.showAlert({
            alertTitleI18nKey: "alert.title.error",
            messageI18nKey: "alert.token_valid_credentials_invalid",
          })
        } else {
          rs.next(response);
        }
      },
      error => {}
    );
    return rs;
  }


  /**
   * @name getStudentCourses
   * @param {ISession} session
   */
  public getStudentCourses(session:ISession):Observable<IPulsAPIResponse_getStudentCourses> {

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
      ConfigProvider.config.webservices.endpoint.puls+"getStudentCourses", request, {headers: this.headers}).subscribe(
      (response:IPulsAPIResponse_getStudentCourses) => {
        // PULS simply responds with "no user rights" if credentials are incorrect
        if(response.message == "no user rights") {

          // we're having a contradiction here, the password is wrong, but
          // the token is still valid. We'll log the user out and send the
          // user to LoginPage
          rs.next(response);

          this.alertProvider.showAlert({
            alertTitleI18nKey: "alert.title.error",
            messageI18nKey: "alert.token_valid_credentials_invalid",
          })
        } else {
          rs.next(response);
        }
      },
      error => {}
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
      subTitle: this.translate.instant("alert.token_valid_credentials_invalid")
    });
    alert.present();
    this.app.getRootNavs()[0].push(LoginPage)
  }

}