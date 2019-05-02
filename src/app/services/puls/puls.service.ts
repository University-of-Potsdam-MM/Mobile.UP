import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AlertController, NavController, ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Observable, ReplaySubject } from 'rxjs';
import { UserSessionService } from '../user-session/user-session.service';
import { AlertService } from '../alert/alert.service';
import { ConfigService } from '../config/config.service';

import {
  IPulsApiRequest_getAcademicAchievements,
  IPulsAPIResponse_getAcademicAchievements,
  IPulsApiRequest_getStudentCourses,
  IPulsAPIResponse_getStudentCourses,
  IPulsAPIResponse_getLectureScheduleRoot,
  IPulsApiRequest_getLectureScheduleRoot,
  IPulsAPIResponse_getLectureScheduleSubTree,
  IPulsApiRequest_getLectureScheduleSubTree,
  IPulsAPIResponse_getLectureScheduleCourses,
  IPulsApiRequest_getLectureScheduleCourses,
  IPulsAPIResponse_getCourseData,
  IPulsApiRequest_getCourseData,
  IPulsAPIResponse_getPersonalStudyAreas,
  IPulsApiRequest_getPersonalStudyAreas } from 'src/app/lib/interfaces_PULS';
import { ISession } from '../login-provider/interfaces';
import { LoginPage } from 'src/app/pages/login/login.page';

@Injectable({
  providedIn: 'root'
})
export class PulsService {

  headers: HttpHeaders;

  constructor(
    private http: HttpClient,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private userSession: UserSessionService,
    private navCtrl: NavController,
    private alertService: AlertService,
    private modalCtrl: ModalController
  ) {
    // set headers for all requests
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': ConfigService.config.webservices.apiToken
    });
  }

  /**
   * @name getLectureScheduleRoot
   */
  public getLectureScheduleRoot(): Observable<IPulsAPIResponse_getLectureScheduleRoot> {

    const request: IPulsApiRequest_getLectureScheduleRoot = {condition: {semester: 0}};

    const rs = new ReplaySubject<IPulsAPIResponse_getLectureScheduleRoot>();

    this.http.post<IPulsAPIResponse_getLectureScheduleRoot>(
      ConfigService.config.webservices.endpoint.pulsGetLectureScheduleRoot.url, request, {headers: this.headers}).subscribe(
      (response: IPulsAPIResponse_getLectureScheduleRoot) => {
        rs.next(response);
      }
    );
    return rs;
  }


  /**
   * @name getLectureScheduleSubTree
   * @param headerId
   */
  public getLectureScheduleSubTree(headerId): Observable<IPulsAPIResponse_getLectureScheduleSubTree> {

    const request: IPulsApiRequest_getLectureScheduleSubTree = {condition: {headerId: headerId}};

    const rs = new ReplaySubject<IPulsAPIResponse_getLectureScheduleSubTree>();

    this.http.post<IPulsAPIResponse_getLectureScheduleSubTree>(
      ConfigService.config.webservices.endpoint.pulsGetLectureScheduleSubTree.url, request, {headers: this.headers}).subscribe(
      (response: IPulsAPIResponse_getLectureScheduleSubTree) => {
        rs.next(response);
      }
    );
    return rs;
  }

  /**
   * @name getLectureScheduleCourses
   * @param headerId
   */
  public getLectureScheduleCourses(headerId): Observable<IPulsAPIResponse_getLectureScheduleCourses> {

    const request: IPulsApiRequest_getLectureScheduleCourses = {condition: {headerId: headerId}};

    const rs = new ReplaySubject<IPulsAPIResponse_getLectureScheduleCourses>();

    this.http.post<IPulsAPIResponse_getLectureScheduleCourses>(
      ConfigService.config.webservices.endpoint.pulsGetLectureScheduleCourses.url, request, {headers: this.headers}).subscribe(
      (response: IPulsAPIResponse_getLectureScheduleCourses) => {
        rs.next(response);
      }
    );
    return rs;
  }

  /**
   * @name getCourseData
   * @param courseId
   */
  public getCourseData(courseId): Observable<IPulsAPIResponse_getCourseData> {

    const request: IPulsApiRequest_getCourseData = {condition: {courseId: courseId}};

    const rs = new ReplaySubject<IPulsAPIResponse_getCourseData>();

    this.http.post<IPulsAPIResponse_getCourseData>(
      ConfigService.config.webservices.endpoint.pulsGetCourseData.url, request, {headers: this.headers}).subscribe(
      (response: IPulsAPIResponse_getCourseData) => {
        rs.next(response);
      }
    );
    return rs;
  }


  /**
   * @name getPersonalStudyAreas
   * @param {ISession} session
   */
  public getPersonalStudyAreas(session: ISession): Observable<IPulsAPIResponse_getPersonalStudyAreas> {

    const request: IPulsApiRequest_getPersonalStudyAreas = {
      // TODO: refactor this someday so credentials are not used
      'user-auth': {
        username: session.credentials.username,
        password: session.credentials.password
      }
    };

    const rs = new ReplaySubject<IPulsAPIResponse_getPersonalStudyAreas>();

    // TODO: check for connection first!
    this.http.post<IPulsAPIResponse_getPersonalStudyAreas>(
      ConfigService.config.webservices.endpoint.pulsGetPersonalStudyAreas.url, request, {headers: this.headers}).subscribe(
      (response: IPulsAPIResponse_getPersonalStudyAreas) => {
        // PULS simply responds with "no user rights" if credentials are incorrect
        if (response.message === 'no user rights') {

          // we're having a contradiction here, the password is wrong, but
          // the token is still valid  so we're having
          // case #81 here. We'll log the user out and send the
          // user to LoginPage

          // this does not necessarily mean that the password is wrong
          // the elistest account f.e. just does not support the grades / timetable functions
          // should not log out
          // this.puls.handleSpecialCase();

          rs.next(response);

          this.alertService.showAlert({
            alertTitleI18nKey: 'alert.title.error',
            messageI18nKey: 'alert.token_valid_credentials_invalid',
          });
        } else {
          rs.next(response);
        }
      },
      error => {}
    );
    return rs;
  }

  /**
   * @name getAcademicAchievements
   * @param {ISession} session
   * @param semester
   * @param mtknr
   * @param stgnr
   */
  public getAcademicAchievements(session: ISession, semester, mtknr, stgnr): Observable<IPulsAPIResponse_getAcademicAchievements> {

    const request: IPulsApiRequest_getAcademicAchievements = {
      condition: {
        Semester: semester,
        MtkNr: mtknr,
        StgNr: stgnr
      },
      'user-auth': {
        username: session.credentials.username,
        password: session.credentials.password
      }
    };

    const rs = new ReplaySubject<IPulsAPIResponse_getAcademicAchievements>();

    this.http.post<IPulsAPIResponse_getAcademicAchievements>(
      ConfigService.config.webservices.endpoint.pulsGetAcademicAchievements.url, request, {headers: this.headers}).subscribe(
      (response: IPulsAPIResponse_getAcademicAchievements) => {
        rs.next(response);
      }
    );
    return rs;
  }

  /**
   * @name getStudentCourses
   * @param {ISession} session
   */
  public getStudentCourses(session: ISession): Observable<IPulsAPIResponse_getStudentCourses> {

    const request: IPulsApiRequest_getStudentCourses = {
      condition: {
        semester: 0,
        allLectures: 0
      },
      // TODO: refactor this someday so credentials are not used
      'user-auth': {
        username: session.credentials.username,
        password: session.credentials.password
      }
    };

    const rs = new ReplaySubject<IPulsAPIResponse_getStudentCourses>();

    // TODO: check for connection first!
    this.http.post<IPulsAPIResponse_getStudentCourses>(
      ConfigService.config.webservices.endpoint.pulsGetStudentCourses.url, request, {headers: this.headers}).subscribe(
      (response: IPulsAPIResponse_getStudentCourses) => {
        // PULS simply responds with "no user rights" if credentials are incorrect
        if (response.message === 'no user rights') {
          // we're having a contradiction here, the password is wrong, but
          // the token is still valid. We'll log the user out and send the
          // user to LoginPage

          rs.next(response);

          this.alertService.showAlert({
            alertTitleI18nKey: 'alert.title.error',
            messageI18nKey: 'alert.token_valid_credentials_invalid',
          });
        } else {
          rs.next(response);
        }
      }, error => {
        console.log(error);
      });

    return rs;
  }

  /**
   * handles special case as described in #81
   */
  async handleSpecialCase() {
    this.userSession.removeSession();
    this.userSession.removeUserInfo();
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('alert.title.error'),
      message: this.translate.instant('alert.token_valid_credentials_invalid')
    });
    alert.present();
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: LoginPage,
    });
    modal.present();
    modal.onWillDismiss().then(() => {
      this.navCtrl.navigateRoot('/home');
    });
  }
}
