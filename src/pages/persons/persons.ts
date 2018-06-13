import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { WebHttpUrlEncodingCodec } from "../../library/util";
import { Storage } from "@ionic/storage";
import { ISession } from "../../providers/login-provider/interfaces";
import { LoginPage } from "../login/login";
import {
  IConfig,
  IPerson,
  IPersonSearchResponse
} from "../../library/interfaces";


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
  waiting_for_response:boolean = false;

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
    // reset array so new persons are displayed
    this.personsFound = [];

    if(query) {
      this.waiting_for_response = true;

      console.log(`[PersonsPage]: Searching for \"${query}\"`);

      let session:ISession = await this.storage.get("session");
      let config:IConfig = await this.storage.get("config");
      if(session) {
        let headers: HttpHeaders = new HttpHeaders()
          .append("Authorization", config.webservices.apiToken);

        let params: HttpParams = new HttpParams({encoder: new WebHttpUrlEncodingCodec()})
          .append("value",        query)
          .append("username",     session.credentials.username)
          .append("password",     session.credentials.password);

        this.http.get(
          config.webservices.endpoint.personSearch,
          {headers:headers, params:params}
          ).subscribe(
          (response:IPersonSearchResponse) => {
            // reset array so new persons are displayed
            this.personsFound = [];
            // use inner object only because it's wrapped in another object
            for(let person of response.people) {
              person.Person.expanded = false;
              person.Person.Raum = person.Person.Raum.replace(/_/g," ");
              this.personsFound.push(person.Person);
            }

            this.waiting_for_response = false;
          },
          error => {
            // reset array so new persons are displayed
            this.personsFound = [];
            console.log(error);
            this.waiting_for_response = false;
          }
        );
      } else {
        // send user to LoginPage if no session has been found
        this.navCtrl.push(LoginPage);
      }

    } else {
      console.log("[PersonsPage]: Empty query");
    }
  }

  expandPerson(person){
    for (let i = 0; i < this.personsFound.length; i++) {
      if(this.personsFound[i].id == person.id){
        this.personsFound[i].expanded = !this.personsFound[i].expanded;
      }else{
        this.personsFound[i].expanded = false;
      }
    }
  }
}
