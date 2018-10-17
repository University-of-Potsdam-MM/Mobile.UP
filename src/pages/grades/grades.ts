import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from "@ionic/storage";
import { ISession } from "../../providers/login-provider/interfaces";
import { LoginPage } from "../login/login";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IConfig, IGradeResponse } from '../../library/interfaces';

@IonicPage()
@Component({
  selector: 'page-grades',
  templateUrl: 'grades.html',
})
export class GradesPage {

  token;
  credentials;
  config:IConfig;

  studentDetails;
  studentGrades;
  i = 7;

  loadingGrades = false;
  gradesLoaded = false;
  studentLoaded = false;
  multipleDegrees = false;          // f.e. bachelor and master
  isDualDegree: boolean[] = [];     // f.e. dual bachelor with BWL and German

  constructor(
      public navCtrl: NavController,
      private http: HttpClient,
      public navParams: NavParams,
      private storage: Storage) {

  }

  goToLogin() {
    this.navCtrl.push(LoginPage);
  }

  async ionViewDidLoad() {
    this.config = await this.storage.get("config");
    this.storage.get("session").then(
      (session:ISession) => {
        if(session) {
          this.token = session.token;
          this.credentials = session.credentials;
          this.getStudentDetails();
        } else {
          this.goToLogin();
        }
    });
  }

  showGrades(i) {
    this.i = i;
    this.gradesLoaded = false;
    this.storage.get("studentGrades["+i+"]").then((studentGrades) => {
      if (studentGrades) {
        console.log(studentGrades);
        this.studentGrades = studentGrades;
        this.gradesLoaded = true;
        // this.getGrades(i);
      } else { this.getGrades(i); }
    });
  }

  getGrades(i) {
      this.loadingGrades = true;
      var headers: HttpHeaders, body;

      if (this.multipleDegrees) {
        headers = new HttpHeaders()
          .append("Authorization", this.config.webservices.apiToken);

        body = {
          "condition": {
            "Semester": this.studentDetails[i].Semester,
            "MtkNr": this.studentDetails[i].MtkNr,
            "StgNr": this.studentDetails[i].StgNr
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

      this.http.post(url, body, {headers:headers}).subscribe((resGrades) => {
        console.log(resGrades);
        this.studentGrades = resGrades;
        this.storage.set("studentGrades["+i+"]", this.studentGrades);
        this.gradesLoaded = true;
        this.loadingGrades = false;
      }, error => {
        console.log("ERROR while getting grades");
        console.log(error);
      });
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

    let url = this.config.webservices.endpoint.puls + "getPersonalStudyAreas";

    this.http.post(url, body, {headers:headers}).subscribe((resStudentDetail:IGradeResponse) => {
      this.studentDetails = resStudentDetail.personalStudyAreas.Abschluss;
      console.log(this.studentDetails);
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
    }, error => {
      console.log("ERROR while getting student details");
      console.log(error);
    });
  }

}
