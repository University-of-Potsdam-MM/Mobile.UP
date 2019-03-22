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
import { TranslateService } from '@ngx-translate/core';
import { AlertService } from 'src/app/services/alert/alert.service';

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
  modalOpen = false;

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
    private callNumber: CallNumber,
    private alert: AlertService,
    private translate: TranslateService
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
      backdropDismiss: false,
      component: LoginPage,
    });
    modal.present();
    this.modalOpen = true;
    modal.onWillDismiss().then(response => {
      this.modalOpen = false;
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
  public async search() {
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

      this.session = await this.sessionProvider.getSession();
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
      if (person.Raum) {
        contact.addresses = [new ContactField()];
        contact.addresses[0].type = 'work';
        contact.addresses[0].streetAddress = person.Raum;
      }

      const exportName = person.Vorname + ' ' + person.Nachname;
      this.contacts.find(['name'], { filter: exportName, multiple: true }).then(response => {
        console.log(response);
        let contactFound = false;
        let contactID;
        for (let i = 0; i < response.length; i++) {
          let foundTel = false;
          let foundMail = false;
          let foundRoom = false;
          if (person.Telefon && response[i].phoneNumbers.length > 0) {
            for (let j = 0; j < response[i].phoneNumbers.length; j++) {
              if (response[i].phoneNumbers[j].value === person.Telefon) {
                foundTel = true;
                break;
              }
            }
          } else if (!person.Telefon) { foundTel = true; }

          if (person.Email && response[i].emails.length > 0) {
            for (let j = 0; j < response[i].emails.length; j++) {
              if (response[i].emails[j].value === person.Email) {
                foundMail = true;
                break;
              }
            }
          } else if (!person.Email) { foundMail = true; }

          if (person.Raum && response[i].addresses.length > 0) {
            for (let j = 0; j < response[i].addresses.length; j++) {
              if (response[i].addresses[j].streetAddress === person.Raum) {
                foundRoom = true;
                break;
              }
            }
          } else if (!person.Raum) { foundRoom = true; }

          if (foundTel && foundMail && foundRoom) {
            contactFound = true;
            break;
          } else if (foundTel || foundMail || foundRoom) {
            contactID = response[i].id;
          }
        }

        if (!contactFound) {
          if (contactID) { contact.id = contactID; }
          this.saveContact(contact);
        } else { this.alert.presentToast(this.translate.instant('alert.contact-exists')); }
      }, error => {
        console.log('[Error]: While finding contacts...');
        console.log(error);
        this.saveContact(contact);
      });
    }
  }

  saveContact(contact: Contact) {
    contact.save().then(
      () => {
        console.log('Contact saved!', contact);
        this.alert.presentToast(this.translate.instant('alert.contact-export-success'));
      },
      (error: any) => {
        console.error('Error saving contact.', error);
        if (error.code && (error.code === 20 || error.code === '20')) {
          this.alert.presentToast(this.translate.instant('alert.permission-denied'));
        } else {
          this.alert.presentToast(this.translate.instant('alert.contact-export-fail'));
        }
      }
    );
  }

  openMail(mail) {
    window.location.href = 'mailto:' + mail;
  }

  /**
   * @name callContact
   * @description using native call for calling numbers
   * @param {string} number
   * https://www.javascripttuts.com/making-phone-calls-to-contacts-with-ionic-in-one-go/
   */
  callContact(number: string) {
    if (this.platform.is('cordova')) {
      this.callNumber.callNumber(number, true)
      .then(() => console.log('Dialer Launched!'))
      .catch(() => console.log('Error launching dialer'));
    } else {
      window.location.href = 'tel:' + number;
    }
  }

}
