import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import {WebHttpUrlEncodingCodec} from "../../library/util";
import {Storage} from "@ionic/storage";
import {ISession} from "../../providers/login-provider/interfaces";
import {LoginPage} from "../login/login";

@IonicPage()
@Component({
  selector: 'page-persons',
  templateUrl: 'persons.html',
})
export class PersonsPage {


  url: string = "https://apiup.uni-potsdam.de/endpoints/personAPI/1.0/";
  private resultsList: Array < Object > ;
  private query: string;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private http: HttpClient,
    private storage: Storage) {

  }

  /**
   * sendRequest
   *
   * sends a HTTP-request and returns an Observable in which the response can be
   * observed.
   * @param query
   */
  private async sendRequest(query: string) {

    let session:ISession = await this.storage.get("session");
    if(session) {

      // TODO: outsource to config
      let headers: HttpHeaders = new HttpHeaders()
        .append("Authorization", "Bearer c58bcde9-973d-37ff-8290-c57a82b73daf");

      let params: HttpParams = new HttpParams({encoder: new WebHttpUrlEncodingCodec()})
        .append("value", query)
        .append("username", session.credentials.username)
        .append("password", session.credentials.password);

      this.http.get(this.url, {headers:headers, params:params}).subscribe(
        response => {
          console.log(response);
          // TODO: do something!
        },
        error => {
          console.log(error)
        }
      );
    } else {
      this.navCtrl.push(LoginPage);
    }

  }

  private showResults() {

  }

  private search(query: string) {
    this.sendRequest(query);
  }

  ionViewDidLoad() {
    this.search("dieter")
  }

}
