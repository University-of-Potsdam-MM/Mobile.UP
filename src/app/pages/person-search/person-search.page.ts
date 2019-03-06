import { Component } from '@angular/core';
import { Platform, ModalController, NavController } from '@ionic/angular';
import { HttpErrorResponse, HttpHeaders, HttpClient } from '@angular/common/http';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { LoginPage } from '../login/login.page';
import { Contacts, Contact, ContactField, ContactName } from '@ionic-native/contacts/ngx';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { IPerson, IConfig } from 'src/app/lib/interfaces';
import { ISession } from 'src/app/services/login-provider/interfaces';
import { ConnectionService } from 'src/app/services/connection/connection.service';
import { UserSessionService } from 'src/app/services/user-session/user-session.service';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-person-search',
  templateUrl: './person-search.page.html',
  styleUrls: ['./person-search.page.scss'],
})
export class PersonSearchPage {

  personsFound: IPerson[] = [];
  response_received: boolean;
  error: HttpErrorResponse;
  session: ISession;
  query = '';
  noResults = false;
  triedRefreshingSession = false;
  cordova = false;

  constructor(
    private platform: Platform,
    private connection: ConnectionService,
    private sessionProvider: UserSessionService,
    private keyboard: Keyboard,
    private http: HttpClient,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    // tslint:disable-next-line: deprecation
    private contacts: Contacts,
    private callNumber: CallNumber
  ) {
    if (this.platform.is('cordova')) {
      this.cordova = true;
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
    this.session = await this.sessionProvider.getSession();

    if (!this.session) {
      this.goToLogin();
    }
  }

  async goToLogin() {
    const modal = await this.modalCtrl.create({
      component: LoginPage,
    });
    modal.present();
    modal.onWillDismiss().then(response => {
      if (response.data.success) {
        this.ionViewWillEnter();
      } else {
        this.navCtrl.navigateRoot('/home');
      }
    });
  }

  // hides keyboard once the user is scrolling
  onScrollListener() {
    if (this.platform.is('cordova') && (this.platform.is('ios') || this.platform.is('android'))) {
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
  public search() {
    // reset array so new persons are displayed
    this.personsFound = [];
    this.noResults = false;

    const query = encodeURI(this.query.trim())
      .replace(/\+/g, '')
      .replace(/\,/g, '')
      .replace(/\//g, '')
      .replace(/\:/g, '')
      .replace(/\;/g, '')
      .replace(/\@/g, '')
      .replace(/\=/g, '')
      .replace(/\$/g, '')
      .replace(/\&/g, '');

    if (query && query.trim() !== '' && query.trim().length > 1) {

      this.response_received = false;

      console.log(`[PersonsPage]: Searching for \"${query}\"`);

      const config: IConfig = ConfigService.config;
      const headers: HttpHeaders = new HttpHeaders()
        .append('Authorization', `${this.session.oidcTokenObject.token_type} ${this.session.token}`);

      const url = config.webservices.endpoint.personSearch + query;

      this.http.get(url, {headers: headers}).subscribe(
        (personsList: IPerson[]) => {
          // console.log(personsList);

          for (const person of personsList) {
            const newPerson = person;
            newPerson.expanded = false;
            newPerson.Raum = person.Raum.replace(/_/g, ' ');
            this.personsFound.push(newPerson);
          }

          this.error = null;
          this.response_received = true;
          this.triedRefreshingSession = false;
        },
        async error => {
          if (!this.triedRefreshingSession) {
            if (error.status === 401) {
              this.connection.checkOnline(true, true);
              this.session = await this.sessionProvider.getSession();

              if (!this.session) {
                this.goToLogin();
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
      console.log('[PersonsPage]: Empty query');
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
      const currentPerson = this.personsFound[i];
      if (currentPerson.Id === person.Id) {
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
    if (this.platform.is('cordova')) {
      const contact: Contact = this.contacts.create();

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