import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { WebHttpUrlEncodingCodec } from "../../library/util";
import { Storage } from "@ionic/storage";
import { ISession } from "../../providers/login-provider/interfaces";
import { LoginPage } from "../login/login";
import { IPerson, IPersonSearchResponse } from "../../library/interfaces";


/**
 * PersonsPage
 *
 * shows a searchbar and sends a request upon hitting submit. Then shows
 * retrieved data as a list of ion-cards
 *
 * TODO: View is reaaally ugly right nows
 */
@IonicPage()
@Component({
  selector: 'page-persons',
  templateUrl: 'persons.html',
})
export class PersonsPage {

  personsFound:IPerson[] = [];

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private http: HttpClient,
    private storage: Storage) {
  }

  /**
   * checks whether a session is stored in memory. If not the user is taken to
   * the LoginPage. If yes a query is sent to the API and the results are placed
   * in this.personsFound so the view can render them
   * @param query
   */
  public async search(query: string) {
    if(query) {
      console.log(`LoginPage: Searching for ${query}`);
      let session:ISession = await this.storage.get("session");
      if(session) {
        // TODO: outsource token and url to config

        let url:string = "https://apiup.uni-potsdam.de/endpoints/personAPI/1.0/.json";

        let headers: HttpHeaders = new HttpHeaders()
          .append("Authorization", "Bearer c58bcde9-973d-37ff-8290-c57a82b73daf");

        let params: HttpParams = new HttpParams({encoder: new WebHttpUrlEncodingCodec()})
          .append("value",        query)
          .append("username",     session.credentials.username)
          .append("password",     session.credentials.password);

        this.http.get(url, {headers:headers, params:params}).subscribe(
          (response:IPersonSearchResponse) => {
            // use inner object only because it's wrapped in another object
            for(let person of response.people) {
              this.personsFound.push(person.Person);
            }
          },
          error => {
            console.log(error)
          }
        );
      } else {
        // send user to LoginPage if no session has been found
        this.navCtrl.push(LoginPage);
      }
    } else {
      console.log("LoginPage: Empty query");
    }
  }
}
