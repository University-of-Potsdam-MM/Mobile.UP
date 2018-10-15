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

  loadingGrades = false;
  gradesLoaded = false;
  studentLoaded = false;

  constructor(
      public navCtrl: NavController,
      private http: HttpClient,
      public navParams: NavParams,
      private storage:  Storage) {

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

  getGrades() {
      this.loadingGrades = true;

      let headers:HttpHeaders = new HttpHeaders()
        .append("Authorization", this.config.webservices.apiToken);

      let body = {
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

      let url = this.config.webservices.endpoint.puls + "getAcademicAchievements";

      this.http.post(url, body, {headers:headers}).subscribe((resGrades) => {
        console.log(resGrades);
        this.studentGrades = resGrades;
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
      console.log(resStudentDetail);
      this.studentDetails = resStudentDetail.personalStudyAreas.Abschluss;
      this.studentLoaded = true;
    }, error => {
      console.log("ERROR while getting student details");
      console.log(error);
    });
  }

}
