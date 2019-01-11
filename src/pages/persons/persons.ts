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
import { Platform } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';
import { ConnectionProvider } from "../../providers/connection/connection";
import { SessionProvider } from '../../providers/session/session';

/**
 * @class PersonPage
 * @classdesc class for a page that shows the entries of the electronic phone book. The list of items can
 * be filtered by using a searchbox and items contain a slide and click option to get details
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

  /**
   * @constructor
   * @description Constructor of EmergencyPage
   *
   * @param {NavController} navCtrl
   * @param {HttpClient} http
   * @param {Platform} platform
   * @param {Keyboard} keyboard
   * @param {ConnectionProvider} connection
   * @param {Storage} storage
   * @param {sessionProvider} sessionProvider
   */
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
   * @name ionViewDidEnter
   * @async
   * @description take user to login if there is no session.
   * We are using ionViewDidEnter here because it is run every time the view is
   * entered, other than ionViewDidLoad which will run only once
   */
  async ionViewWillEnter(){
    this.connection.checkOnline(true, true);
    this.session = JSON.parse(await this.sessionProvider.getSession());
    if(!this.session){
      this.navCtrl.push(LoginPage).then(
        result => console.log("[PersonsPage]: Pushed LoginPage")
      );
    }
  }

  // hides keyboard once the user is scrolling
  onScrollListener() {
    if (this.platform.is("cordova") && (this.platform.is("ios") || this.platform.is("android"))) {
      this.keyboard.hide();
    }
  }

  /**
   * @name search
   * @async
   * @description checks whether a session is stored in memory. If not the user is taken to
   * the LoginPage. If yes a query is sent to the API and the results are placed
   * in this.personsFound so the view can render them
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
        .append("Authorization", `${this.session.oidcTokenObject.token_type} ${this.session.token}`);

      var url = config.webservices.endpoint.personSearch + this.query;

      this.http.get(url,{headers: headers}).subscribe(
        (personsList:IPerson[]) => {
          //console.log(personsList);

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

  /**
   * @name expandPerson
   * @description toogles person item in list view to show details
   * @param person
   */
  expandPerson(person) {
    for (let i = 0; i < this.personsFound.length; i++) {
      let currentPerson = this.personsFound[i];
      if (currentPerson.Id == person.Id) {
        currentPerson.expanded = !currentPerson.expanded;
      }
    }
  }

}