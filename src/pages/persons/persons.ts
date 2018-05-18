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


  url: string = "https://apiup.uni-potsdam.de/endpoints/personsAPI/1.0/";
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
  private sendRequest(query: string): Observable < Object > {
    let headers: HttpHeaders = new HttpHeaders();
    let params: HttpParams = new HttpParams({encoder: new WebHttpUrlEncodingCodec()});

    headers.set("Authorization", "Bearer c58bcde9-973d-37ff-8290-c57a82b73daf");

    params.set("value", query);
    //params.set("username", this.auth.getUserInfo().id); // temporary
    //params.set("password", this.auth.getUserInfo().id); // temporary

    params.set("username", "elistest");
    params.set("password", "%2B_eLiS%3F14");

    // creates an Observable and returns it so that the receiver can access the
    // results
    return Observable.create(
      observer => {
        this.http.get(
          this.url, {headers: headers,params: params}
        ).subscribe(
          results => {
            console.log(results);

          }
        );
      }
    );
  }

  private showResults() {

  }

  private search(query: string) {
    this.sendRequest(query);
  }

  ionViewDidLoad() {
    this.storage.get("session").then(
      (session:ISession) => {
        if(!session) {
          this.navCtrl.push(LoginPage);
        }
      }
    )
  }

}
