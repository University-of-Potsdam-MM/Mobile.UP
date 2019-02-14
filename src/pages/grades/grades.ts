import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { IPulsAPIResponse_getPersonalStudyAreas,
         IPulsAPIResponse_getAcademicAchievements
        } from '../../library/interfaces_PULS';
import { Storage } from '@ionic/storage';
import { LoginPage } from "../login/login";
import { IConfig } from '../../library/interfaces';
import { CacheService } from 'ionic-cache';
import { ConnectionProvider } from '../../providers/connection/connection';
import { SessionProvider } from '../../providers/session/session';
import { PulsProvider } from '../../providers/puls/puls';
import { of } from 'rxjs';


@IonicPage()
@Component({
  selector: 'page-grades',
  templateUrl: 'grades.html',
})
export class GradesPage {

  token;
  credentials;
  config: IConfig;

  refresher;
  studentDetails;
  studentGrades;
  i;
  noUserRights;

  loadingGrades = false;
  gradesLoaded = false;
  studentLoaded = false;
  multipleDegrees = false;          // f.e. bachelor and master
  isDualDegree: boolean[] = [];     // f.e. dual bachelor with BWL and German
  session;

  constructor(
      public navCtrl: NavController,
      private cache: CacheService,
      public navParams: NavParams,
      private storage: Storage,
      private connection: ConnectionProvider,
      private sessionProvider: SessionProvider,
      private puls:PulsProvider) {
  }

  /**
   * @name goToLogin
   */
  goToLogin(): void {
    this.navCtrl.push(LoginPage);
  }

  /**
   * @async
   * @name ionViewWillEnter
   */
  async ionViewWillEnter() {
    this.connection.checkOnline(true, true);
    this.config = await this.storage.get("config");

    let tmp = await this.sessionProvider.getSession();
    let session = undefined;
    if (tmp) {
      if (typeof tmp !== 'object') {
        session = JSON.parse(tmp);
      } else { session = tmp; }
    }

    if (session) {
      this.session = session;
      this.getStudentDetails();
    } else {
      this.goToLogin();
    }
  }

  /**
   * @name showGrades
   * @param i
   */
  showGrades(i): void {
    if (this.i === i) {
      this.gradesLoaded = !this.gradesLoaded;
    } else {
      this.i = i;
      this.gradesLoaded = false;
      this.getGrades();
    }
  }

  /**
   * @name getGrades
   */
  getGrades(): void {
    if (this.refresher != null) {
      this.cache.removeItem('getAcademicAchievements'+this.i);
    } else { this.loadingGrades = true; }

    let semester, mtknr, stgnr;

    if (this.multipleDegrees) {
      semester = this.studentDetails[this.i].Semester;
      mtknr = this.studentDetails[this.i].MtkNr;
      stgnr = this.studentDetails[this.i].StgNr;
    } else {
      semester = this.studentDetails.Semester;
      mtknr = this.studentDetails.MtkNr;
      stgnr = this.studentDetails.StgNr;
    }

    this.cache.loadFromObservable('getAcademicAchievements'+this.i, of(this.puls.getAcademicAchievements(this.session, semester, mtknr, stgnr).subscribe(
      (resGrades:IPulsAPIResponse_getAcademicAchievements) => {
        if (resGrades) {
          this.studentGrades = resGrades;
          this.gradesLoaded = true;
        } else { this.studentGrades = undefined; }

        this.loadingGrades = false;
      }, error => {
        console.log('ERROR while getting grades');
        console.log(error);
      })));

    if (this.refresher != null) {
      this.refresher.complete();
    }
  }

  /**
   * @name refreshGrades
   * @param refresher
   */
  refreshGrades(refresher): void {
    this.refresher = refresher;
    if (this.i != undefined) {
      this.getGrades();
    } else {
      this.getStudentDetails();
    }
  }

  /**
   * @name getStudentDetails
   */
  getStudentDetails(): void {

    if (this.refresher != null) {
      this.cache.removeItem("getPersonalStudyAreas");
    } else {
      this.studentLoaded = false;
    }

    this.cache.loadFromObservable('getPersonalStudyAreas', of(this.puls.getPersonalStudyAreas(this.session).subscribe(
      (resStudentDetail:IPulsAPIResponse_getPersonalStudyAreas) => {
        if (resStudentDetail) {
          if (resStudentDetail.personalStudyAreas && resStudentDetail.personalStudyAreas.Abschluss) {
            this.studentDetails = resStudentDetail.personalStudyAreas.Abschluss;
            if (Array.isArray(this.studentDetails)) {
              this.multipleDegrees = true;
              let i;
              for (i = 0; i < this.studentDetails.length; i++) {
                if (this.studentDetails[i].Studiengaenge && Array.isArray(this.studentDetails[i].Studiengaenge)) {
                  this.isDualDegree[i] = true;
                } else { this.isDualDegree[i] = false; }
              }
            } else {
              this.multipleDegrees = false;
              if (this.studentDetails.Studiengaenge && Array.isArray(this.studentDetails.Studiengaenge)) {
                this.isDualDegree[0] = true;
              }
            }
            this.studentLoaded = true;
          } else if (resStudentDetail.message) {
            this.noUserRights = true;
          }
        }
      }, (error) => {
        console.log('ERROR while getting student details');
        console.log(error);
      })));

    if (this.refresher != null) {
      this.refresher.complete();
    }
  }

}
