import {Component} from '@angular/core';
import {IonicPage, NavController} from 'ionic-angular';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from '@angular/common/http';
import {WebHttpUrlEncodingCodec} from "../../library/util";
import {Storage} from "@ionic/storage";
import {ISession} from "../../providers/login-provider/interfaces";
import {LoginPage} from "../login/login";
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

  personsFound: IPerson[] = [];
  waiting_for_response: boolean = false;
  error: HttpErrorResponse;
  session:ISession;

  constructor(
    private navCtrl: NavController,
    private http: HttpClient,
    private storage: Storage) {
  }

  /**
   * take user to login if there is no session.
   * We are using ionViewDidEnter here because it is run every time the view is
   * entered, other than ionViewDidLoad which will run only once
   */
  async ionViewWillEnter(){
    this.session = await this.storage.get("session");
    if(!this.session){
      this.navCtrl.push(LoginPage).then(
        result => console.log("[PersonsPage]: Pushed LoginPage")
      );
    }
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

    if (query) {
      this.waiting_for_response = true;

      console.log(`[PersonsPage]: Searching for \"${query}\"`);

      let config: IConfig = await this.storage.get("config");
      let headers: HttpHeaders = new HttpHeaders()
        .append("Authorization", `${this.session.oidcTokenObject.token_type} ${this.session.token}`);

      this.http.get(
        config.webservices.endpoint.personSearch + query,
        {headers: headers}
      ).subscribe(
        (personsList:IPerson[]) => {

          for (let person of personsList) {
            let newPerson = person;
            newPerson.expanded = false;
            newPerson.Raum = person.Raum.replace(/_/g, " ");
            this.personsFound.push(newPerson);
          }

          this.waiting_for_response = false;
        },
        error => {
          // reset array so new persons are displayed
          this.personsFound = [];
          this.error = error;
          console.log(error);
          this.waiting_for_response = false;
        }
      );

    } else {
      console.log("[PersonsPage]: Empty query");
    }
  }

  expandPerson(person) {
    for (let i = 0; i < this.personsFound.length; i++) {
      if (this.personsFound[i].id == person.id) {
        this.personsFound[i].expanded = !this.personsFound[i].expanded;
      }
    }
  }
}
