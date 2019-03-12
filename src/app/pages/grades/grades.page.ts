import { Component } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { CacheService } from 'ionic-cache';
import { LoginPage } from '../login/login.page';
import { of } from 'rxjs';
import { IConfig } from 'src/app/lib/interfaces';
import { PulsService } from 'src/app/services/puls/puls.service';
import { ConnectionService } from 'src/app/services/connection/connection.service';
import { UserSessionService } from 'src/app/services/user-session/user-session.service';
import { ConfigService } from 'src/app/services/config/config.service';
import { IPulsAPIResponse_getAcademicAchievements, IPulsAPIResponse_getPersonalStudyAreas } from 'src/app/lib/interfaces_PULS';

@Component({
  selector: 'app-grades',
  templateUrl: './grades.page.html',
  styleUrls: ['./grades.page.scss'],
})
export class GradesPage {

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
    private puls: PulsService,
    private cache: CacheService,
    private navCtrl: NavController,
    private modalCtrl: ModalController,
    private connection: ConnectionService,
    private sessionProvider: UserSessionService
  ) { }

  /**
   * @async
   * @name ionViewWillEnter
   */
  async ionViewWillEnter() {
    this.connection.checkOnline(true, true);
    this.config = ConfigService.config;
    this.session = await this.sessionProvider.getSession();

    if (this.session) {
      this.getStudentDetails();
    } else {
      this.goToLogin();
    }
  }

  async goToLogin() {
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: LoginPage,
    });
    modal.present();
    modal.onWillDismiss().then(response => {
      if (response.data.success) {
        this.ionViewWillEnter();
      } else {
        this.navCtrl.navigateRoot('/home');
      }
    });
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
      this.cache.removeItem('getAcademicAchievements' + this.i);
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

    this.cache.loadFromObservable(
      'getAcademicAchievements' + this.i, of(this.puls.getAcademicAchievements(this.session, semester, mtknr, stgnr).subscribe(
      (resGrades: IPulsAPIResponse_getAcademicAchievements) => {
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
    if (this.i !== undefined) {
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
      this.cache.removeItem('getPersonalStudyAreas');
    } else {
      this.studentLoaded = false;
    }

    this.cache.loadFromObservable('getPersonalStudyAreas', of(this.puls.getPersonalStudyAreas(this.session).subscribe(
      (resStudentDetail: IPulsAPIResponse_getPersonalStudyAreas) => {
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
