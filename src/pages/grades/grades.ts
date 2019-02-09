import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from "@ionic/storage";
import { LoginPage } from "../login/login";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IConfig, IGradeResponse } from '../../library/interfaces';
import { CacheService } from 'ionic-cache';
import { ConnectionProvider } from "../../providers/connection/connection";
import { SessionProvider } from '../../providers/session/session';

@IonicPage()
@Component({
  selector: 'page-grades',
  templateUrl: 'grades.html',
})
export class GradesPage {

  token;
  credentials;
  config:IConfig;

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
      public navCtrl: NavController,
      private http: HttpClient,
      private cache: CacheService,
      public navParams: NavParams,
      private storage: Storage,
      private connection: ConnectionProvider,
      private sessionProvider: SessionProvider) {

  }

  goToLogin() {
    this.navCtrl.push(LoginPage);
  }

  async ionViewWillEnter() {
    this.connection.checkOnline(true, true);
    this.config = await this.storage.get("config");
    let tmp = await this.sessionProvider.getSession();
    var session = undefined;
    if (tmp) {
      if (typeof tmp !== 'object') {
        session = JSON.parse(tmp);
      } else { session = tmp; }
    }

    if (session) {
      this.token = session.token;
      this.credentials = session.credentials;
      this.getStudentDetails();
    } else {
      this.goToLogin();
    }
  }

  showGrades(i) {
    if (this.i == i) {
      this.gradesLoaded = !this.gradesLoaded;
    } else {
      this.i = i;
      this.gradesLoaded = false;
      this.getGrades();
    }
  }

  getGrades() {
    if (this.config && this.credentials && this.credentials.username && this.credentials.password) {
      if (this.refresher != null) {
        this.cache.removeItem("getAcademicAchievements"+this.i);
      } else { this.loadingGrades = true; }

      var body;

      let headers = new HttpHeaders()
        .append("Authorization", this.config.webservices.apiToken);

      if (this.multipleDegrees) {
        body = {
          "condition": {
            "Semester": this.studentDetails[this.i].Semester,
            "MtkNr": this.studentDetails[this.i].MtkNr,
            "StgNr": this.studentDetails[this.i].StgNr
          },
          "user-auth": {
            "username": this.credentials.username,
            "password": this.credentials.password
          }
        }
      } else {
        body = {
          "condition": {
            "Semester": this.studentDetails.Semester,
            "MtkNr": this.studentDetails.MtkNr,
            "StgNr": this.studentDetails.StgNr
          },
          "user-auth": {
            "username": this.credentials.username,
            "password": this.credentials.password
          }
        }
      }

      let url = this.config.webservices.endpoint.puls + "getAcademicAchievements";
      let request = this.http.post(url, body, {headers:headers});
      this.cache.loadFromObservable("getAcademicAchievements"+this.i, request).subscribe((resGrades) => {
        if (resGrades) {
          this.studentGrades = resGrades;
          this.gradesLoaded = true;
        } else { this.studentGrades = undefined; }

        this.loadingGrades = false;
      }, error => {
        console.log("ERROR while getting grades");
        console.log(error);
      });

      if (this.refresher != null) {
        this.refresher.complete();
      }
    }
  }

  refreshGrades(refresher) {
    this.refresher = refresher;
    if (this.i != undefined) {
      this.getGrades();
    } else {
      this.getStudentDetails();
    }
  }

  getStudentDetails() {
    if (this.config && this.credentials && this.credentials.username && this.credentials.password) {
      let headers:HttpHeaders = new HttpHeaders()
        .append("Authorization", this.config.webservices.apiToken);

      let body = {
        "user-auth": {
          "username": this.credentials.username,
          "password": this.credentials.password
        }
      }

      if (this.refresher != null) {
        this.cache.removeItem("getPersonalStudyAreas");
      } else { this.studentLoaded = false; }

      let url = this.config.webservices.endpoint.puls + "getPersonalStudyAreas";
      let request = this.http.post(url, body, {headers:headers});
      this.cache.loadFromObservable("getPersonalStudyAreas", request).subscribe((resStudentDetail:IGradeResponse) => {
        if (resStudentDetail && resStudentDetail.message) {
          // the session is still valid but credentials are rejected, so we're having
          // case #81 here
          this.noUserRights = true;

          // this does not necessarily mean that the password is wrong
          // the elistest account f.e. just does not support the grades / timetable functions
          // should not log out
          // this.puls.handleSpecialCase();
        } else if (resStudentDetail) {
          if (resStudentDetail.personalStudyAreas && resStudentDetail.personalStudyAreas.Abschluss) {
            this.studentDetails = resStudentDetail.personalStudyAreas.Abschluss;
            if (Array.isArray(this.studentDetails)) {
              this.multipleDegrees = true;
              var i;
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
          }
        }
      }, error => {
        console.log("ERROR while getting student details");
        console.log(error);
      });

      if (this.refresher != null) {
        this.refresher.complete();
      }
    }
  }

}
