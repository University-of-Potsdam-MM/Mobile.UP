import { Component } from '@angular/core';
import { CacheService } from 'ionic-cache';
import { of } from 'rxjs';
import { IConfig } from 'src/app/lib/interfaces';
import { PulsService } from 'src/app/services/puls/puls.service';
import { IPulsAPIResponse_getAcademicAchievements, IPulsAPIResponse_getPersonalStudyAreas } from 'src/app/lib/interfaces_PULS';
import { AbstractPage } from 'src/app/lib/abstract-page';

@Component({
  selector: 'app-grades',
  templateUrl: './grades.page.html',
  styleUrls: ['./grades.page.scss'],
})
export class GradesPage extends AbstractPage {

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

  constructor(
    private puls: PulsService,
    private cache: CacheService
  ) {
    super({ requireNetwork: true, requireSession: true });
  }

  /**
   * @async
   * @name ionViewWillEnter
   */
  ionViewWillEnter() {
    if (this.session) {
      this.getStudentDetails();
    } else {
      setTimeout(() => {
        this.ionViewWillEnter();
      }, 500);
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
      this.refresher.target.complete();
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
      this.refresher.target.complete();
    }
  }

}
