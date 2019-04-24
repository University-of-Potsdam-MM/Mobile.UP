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
  IPulsApiRequest_getPersonalStudyAreas,
  IPulsApiRequest_getLectureScheduleAll,
  IPulsAPIResponse_getLectureScheduleAll } from 'src/app/lib/interfaces_PULS';
import { ISession } from '../login-provider/interfaces';
import { LoginPage } from 'src/app/pages/login/login.page';
import { CacheService } from 'ionic-cache';

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
    private modalCtrl: ModalController,
    private cache: CacheService
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

    const httpRequest = this.http.post<IPulsAPIResponse_getLectureScheduleRoot>(
      ConfigService.config.webservices.endpoint.puls + 'getLectureScheduleRoot', request, {headers: this.headers});

    this.cache.loadFromObservable('getLectureScheduleRoot', httpRequest).subscribe(
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

    const httpRequest = this.http.post<IPulsAPIResponse_getLectureScheduleSubTree>(
      ConfigService.config.webservices.endpoint.puls + 'getLectureScheduleSubTree', request, {headers: this.headers});

    this.cache.loadFromObservable('getLectureScheduleSubTree' + headerId, httpRequest).subscribe(
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

    const httpRequest = this.http.post<IPulsAPIResponse_getLectureScheduleCourses>(
      ConfigService.config.webservices.endpoint.puls + 'getLectureScheduleCourses', request, {headers: this.headers});

    this.cache.loadFromObservable('getLectureScheduleCourses' + headerId, httpRequest).subscribe(
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

    const httpRequest = this.http.post<IPulsAPIResponse_getCourseData>(
      ConfigService.config.webservices.endpoint.puls + 'getCourseData', request, {headers: this.headers});

    this.cache.loadFromObservable('getCourseData' + courseId, httpRequest).subscribe(
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
      ConfigService.config.webservices.endpoint.puls + 'getPersonalStudyAreas', request, {headers: this.headers}).subscribe(
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
      ConfigService.config.webservices.endpoint.puls + 'getAcademicAchievements', request, {headers: this.headers}).subscribe(
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
      ConfigService.config.webservices.endpoint.puls + 'getStudentCourses', request, {headers: this.headers}).subscribe(
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

  public getLectureScheduleAll(): Observable<IPulsAPIResponse_getLectureScheduleAll> {

    const headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': ConfigService.config.webservices.apiToken
    });

    const request: IPulsApiRequest_getLectureScheduleAll = {
      condition: {
        semester: 0
      }
    };

    const rs = new ReplaySubject<IPulsAPIResponse_getLectureScheduleAll>();

    const httpRequest = this.http.post<IPulsAPIResponse_getLectureScheduleAll>(
      ConfigService.config.webservices.endpoint.puls + 'getLectureScheduleAll',
      request,
      {headers: headers}
    );

    this.cache.loadFromObservable('getLectureScheduleAll', httpRequest).subscribe(
      (response: IPulsAPIResponse_getLectureScheduleAll) => {
        // PULS simply responds with "no user rights" if credentials are incorrect (?)
        if (response.message === 'no user rights') {
          rs.next(response);

          this.alertService.showAlert({
            alertTitleI18nKey: 'alert.title.error',
            messageI18nKey: 'alert.token_valid_credentials_invalid',
          });
        } else {
          rs.next(response);
        }
      },
      error => {
        console.log('[PulsService]: Error getting lecture schedule.');
        console.log(error);
      }
    );

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
