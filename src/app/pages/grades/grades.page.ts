import { Component } from '@angular/core';
import { IConfig } from 'src/app/lib/interfaces';
import {
  IPulsAPIResponse_getAcademicAchievements,
  IPulsAPIResponse_getPersonalStudyAreas,
} from 'src/app/lib/interfaces_PULS';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';

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
  noUserRights = false;
  networkError;

  loadingGrades = false;
  gradesLoaded = false;
  studentLoaded = false;
  multipleDegrees = false; // f.e. bachelor and master
  isDualDegree: boolean[] = []; // f.e. dual bachelor with BWL and German

  constructor(private ws: WebserviceWrapperService) {
    super({ optionalNetwork: true, requireSession: true });
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
    let localSemester;
    let localMtknr;
    let localStgnr;

    if (this.multipleDegrees) {
      localSemester = this.studentDetails[this.i].Semester;
      localMtknr = this.studentDetails[this.i].MtkNr;
      localStgnr = this.studentDetails[this.i].StgNr;
    } else {
      localSemester = this.studentDetails.Semester;
      localMtknr = this.studentDetails.MtkNr;
      localStgnr = this.studentDetails.StgNr;
    }

    if (!(this.refresher && this.refresher.target)) {
      this.loadingGrades = true;
    }

    this.networkError = false;
    this.ws
      .call(
        'pulsGetAcademicAchievements',
        {
          session: this.session,
          semester: localSemester,
          mtknr: localMtknr,
          stgnr: localStgnr,
        },
        { forceRefresh: this.refresher !== undefined }
      )
      .subscribe(
        (resGrades: IPulsAPIResponse_getAcademicAchievements) => {
          if (resGrades) {
            this.studentGrades = resGrades;
            if (!this.refresher) {
              this.gradesLoaded = true;
            }
          } else {
            this.studentGrades = undefined;
          }

          this.loadingGrades = false;
        },
        (error) => {
          this.loadingGrades = false;
          this.networkError = true;
          // this.logger.error('getGrades()', error);
        }
      );

    if (this.refresher && this.refresher.target) {
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
  async getStudentDetails() {
    this.networkError = false;
    if (!(this.refresher && this.refresher.target)) {
      this.studentLoaded = false;
    }

    if (
      !(
        this.session &&
        this.session.credentials &&
        this.session.credentials.username &&
        this.session.credentials.password
      )
    ) {
      // try to reload session since no login data is found
      this.session = await this.sessionProvider.getSession();
    }

    this.ws
      .call(
        'pulsGetPersonalStudyAreas',
        { session: this.session },
        { forceRefresh: this.refresher !== undefined }
      )
      .subscribe(
        (resStudentDetail: IPulsAPIResponse_getPersonalStudyAreas) => {
          if (resStudentDetail) {
            if (
              resStudentDetail.personalStudyAreas &&
              resStudentDetail.personalStudyAreas.Abschluss
            ) {
              this.studentDetails =
                resStudentDetail.personalStudyAreas.Abschluss;
              if (Array.isArray(this.studentDetails)) {
                this.multipleDegrees = true;
                let i;
                for (i = 0; i < this.studentDetails.length; i++) {
                  if (
                    this.studentDetails[i].Studiengaenge &&
                    Array.isArray(this.studentDetails[i].Studiengaenge)
                  ) {
                    this.isDualDegree[i] = true;
                  } else {
                    this.isDualDegree[i] = false;
                  }
                }
              } else {
                this.multipleDegrees = false;
                if (
                  this.studentDetails.Studiengaenge &&
                  Array.isArray(this.studentDetails.Studiengaenge)
                ) {
                  this.isDualDegree[0] = true;
                }
              }
              this.studentLoaded = true;
            } else if (
              resStudentDetail.message &&
              resStudentDetail.message === 'no user rights'
            ) {
              this.noUserRights = true;
            }
          }
        },
        () => {
          this.studentLoaded = true;
          this.networkError = true;
        }
      );

    if (this.refresher && this.refresher.target) {
      this.refresher.target.complete();
    }
  }
}
