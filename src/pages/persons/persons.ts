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
import { Contacts, Contact, ContactField, ContactName } from '@ionic-native/contacts';
import { CallNumber } from '@ionic-native/call-number/ngx';

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
  triedRefreshingSession = false;
  cordova = false;

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
   * @param {Contacts} contacts
   * @param {CallNumber} callNumber
   */
  constructor(
    private navCtrl: NavController,
    private http: HttpClient,
    private platform: Platform,
    private keyboard: Keyboard,
    private connection: ConnectionProvider,
    private storage: Storage,
    private sessionProvider: SessionProvider,
    private contacts: Contacts,
    private callNumber: CallNumber) {
      if (this.platform.is("cordova")) {
        this.cordova = true
      }
  }

  /**
   * @name ionViewWillEnter
   * @async
   * @description take user to login if there is no session.
   * We are using ionViewDidEnter here because it is run every time the view is
   * entered, other than ionViewDidLoad which will run only once
   */
  async ionViewWillEnter() {
    this.connection.checkOnline(true, true);
    this.session = JSON.parse(await this.sessionProvider.getSession());
    if (!this.session) {
      this.navCtrl.push(LoginPage).then(
        () => console.log("[PersonsPage]: Pushed LoginPage")
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

    let query = encodeURI(this.query.trim())
      .replace(/\+/g, "")
      .replace(/\,/g, "")
      .replace(/\//g, "")
      .replace(/\:/g, "")
      .replace(/\;/g, "")
      .replace(/\@/g, "")
      .replace(/\=/g, "")
      .replace(/\$/g, "")
      .replace(/\&/g, "");

    if (query && query.trim() != "" && query.trim().length > 1) {

      this.response_received = false;

      console.log(`[PersonsPage]: Searching for \"${query}\"`);

      let config: IConfig = await this.storage.get("config");
      let headers: HttpHeaders = new HttpHeaders()
        .append("Authorization", `${this.session.oidcTokenObject.token_type} ${this.session.token}`);

      var url = config.webservices.endpoint.personSearch + query;

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
          this.triedRefreshingSession = false;
        },
        async error => {
          if (!this.triedRefreshingSession) {
            if (error.status == 401) {
              this.connection.checkOnline(true, true);
              this.session = JSON.parse(await this.sessionProvider.getSession());
              if (!this.session) {
                this.navCtrl.push(LoginPage).then(
                  () => console.log("[PersonsPage]: Pushed LoginPage")
                );
              } else {
                this.triedRefreshingSession = true;
                this.search();
              }
            } else {
              this.error = error;
              console.log(error);
              this.response_received = true;
            }
          } else {
            this.error = error;
            console.log(error);
            this.response_received = true;
          }
        }
      );

      if (this.personsFound.length > 0) {
        this.noResults = false;
      } else { this.noResults = true; }

    } else {
      console.log("[PersonsPage]: Empty query");
      this.response_received = true;
      this.noResults = true;
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

  /**
   * @name exportContact
   * @description exports a contact to the local phone book
   * @param {IPerson} person
   */
  exportContact(person: IPerson) {
    if (this.platform.is("cordova")) {
      let contact: Contact = this.contacts.create();

      contact.name = new ContactName(null, person.Nachname, person.Vorname);

      if (person.Telefon) { contact.phoneNumbers = [new ContactField('work', person.Telefon)]; }
      if (person.Email)   { contact.emails = [new ContactField('work', person.Email)]; }

      contact.save().then(
        () => console.log('Contact saved!', contact),
        (error: any) => console.error('Error saving contact.', error)
      );
    }
  }

  /**
   * @name callContact
   * @description using native call for calling numbers
   * @param {string} number
   * https://www.javascripttuts.com/making-phone-calls-to-contacts-with-ionic-in-one-go/
   */
  callContact(number: string) {
    this.callNumber.callNumber(number, true)
      .then(() => console.log('Dialer Launched!'))
      .catch(() => console.log('Error launching dialer'));
  }
}