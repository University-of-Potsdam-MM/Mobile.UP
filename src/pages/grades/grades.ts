import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from "@ionic/storage";
import { LoginPage } from "../login/login";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IConfig, IGradeResponse } from '../../library/interfaces';
import { CacheService } from 'ionic-cache';
import {PulsProvider} from "../../providers/puls/puls";
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
      private sessionProvider: SessionProvider,
      private puls:PulsProvider) {

  }

  goToLogin() {
    this.navCtrl.push(LoginPage);
  }

  async ionViewDidLoad() {
    this.config = await this.storage.get("config");
    let session = JSON.parse(await this.sessionProvider.getSession());

    if (session) {
      this.token = session.token;
      this.credentials = session.credentials;
      this.getStudentDetails();
    } else {
      this.goToLogin();
    }
  }

  showGrades(i) {
    this.i = i;
    this.gradesLoaded = false;
    this.getGrades();
  }

  getGrades() {
      if (this.refresher != null) {
        this.cache.removeItem("getAcademicAchievements"+this.i);
      } else {
        this.loadingGrades = true;
      }

      var headers: HttpHeaders, body;

      if (this.multipleDegrees) {
        headers = new HttpHeaders()
          .append("Authorization", this.config.webservices.apiToken);

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
        headers = new HttpHeaders()
          .append("Authorization", this.config.webservices.apiToken);

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
        // console.log(resGrades);
        this.studentGrades = resGrades;
        this.gradesLoaded = true;
        this.loadingGrades = false;
      }, error => {
        console.log("ERROR while getting grades");
        console.log(error);
      });

      if (this.refresher != null) {
        this.refresher.complete();
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
    } else {
      this.studentLoaded = false;
    }

    let url = this.config.webservices.endpoint.puls + "getPersonalStudyAreas";
    let request = this.http.post(url, body, {headers:headers});
    this.cache.loadFromObservable("getPersonalStudyAreas", request).subscribe((resStudentDetail:IGradeResponse) => {
      console.log(resStudentDetail);
      if (resStudentDetail.message) {
        // the session is still valid but credentials are rejected, so we're having
        // case #81 here
        this.noUserRights = true;
        this.puls.handleSpecialCase();
      } else {
        this.studentDetails = resStudentDetail.personalStudyAreas.Abschluss;
        // console.log(this.studentDetails);
        if (Array.isArray(this.studentDetails)) {
          this.multipleDegrees = true;
          var i;
          for (i = 0; i < this.studentDetails.length; i++) {
            if (Array.isArray(this.studentDetails[i].Studiengaenge)) {
              this.isDualDegree[i] = true;
            }
          }
        } else {
          this.multipleDegrees = false;
          if (Array.isArray(this.studentDetails.Studiengaenge)) {
            this.isDualDegree[0] = true;
          }
        }
        this.studentLoaded = true;
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
