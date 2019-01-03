import { Component } from '@angular/core';
import {
  IonicPage,
  NavController
} from 'ionic-angular';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders
} from '@angular/common/http';
import { Storage } from "@ionic/storage";
import { ISession } from "../../providers/login-provider/interfaces";
import { LoginPage } from "../login/login";
import {
  IConfig,
  IPerson
} from "../../library/interfaces";
import { Platform } from 'ionic-angular/platform/platform';
import { Keyboard } from '@ionic-native/keyboard';
import { ConnectionProvider } from "../../providers/connection/connection";
import { SessionProvider } from '../../providers/session/session';

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
  response_received: boolean;
  error: HttpErrorResponse;
  session:ISession;
  query = "";
  noResults = false;

  constructor(
    private navCtrl: NavController,
    private http: HttpClient,
    private platform: Platform,
    private keyboard: Keyboard,
    private connection: ConnectionProvider,
    private storage: Storage,
    private sessionProvider: SessionProvider) {
  }

  /**
   * take user to login if there is no session.
   * We are using ionViewDidEnter here because it is run every time the view is
   * entered, other than ionViewDidLoad which will run only once
   */
  async ionViewWillEnter(){
    this.connection.checkOnline(true, true);
  }

  // hides keyboard once the user is scrolling
  onScrollListener() {
    if (this.platform.is("cordova") && (this.platform.is("ios") || this.platform.is("android"))) {
      this.keyboard.hide();
    }
  }

  /**
   * checks whether a session is stored in memory. If not the user is taken to
   * the LoginPage. If yes a query is sent to the API and the results are placed
   * in this.personsFound so the view can render them
   * @param query
   */
  public async search() {
    // reset array so new persons are displayed
    this.personsFound = [];
    this.noResults = false;

    if (this.query && this.query.trim() != "" && this.query.trim().length > 1) {
      this.response_received = false;

      console.log(`[PersonsPage]: Searching for \"${this.query}\"`);

      let config: IConfig = await this.storage.get("config");
      let headers: HttpHeaders = new HttpHeaders()
        .append("Authorization", config.webservices.apiToken);

      var url = config.webservices.endpoint.personSearch + this.query;

      this.http.get(url, {headers: headers}).subscribe(
        (personsList:IPerson[]) => {
          console.log(personsList);

          for (let person of personsList) {
            let newPerson = person;
            newPerson.expanded = false;
            newPerson.Raum = person.Raum.replace(/_/g, " ");
            this.personsFound.push(newPerson);
          }

          this.error = null;
          this.response_received = true;
        },
        error => {
          this.error = error;
          console.log(error);
          this.response_received = true;
        }
      );

      if (this.personsFound.length > 0) {
        this.noResults = false;
      } else { this.noResults = true; }

    } else {
      console.log("[PersonsPage]: Empty query");
      this.response_received = true;
    }
  }

  expandPerson(person) {
    for (let i = 0; i < this.personsFound.length; i++) {
      let currentPerson = this.personsFound[i];
      if (currentPerson.Id == person.Id) {
        currentPerson.expanded = !currentPerson.expanded;
      }
    }
  }
}
