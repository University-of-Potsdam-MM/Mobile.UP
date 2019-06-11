import { Component } from '@angular/core';
import { Platform } from '@ionic/angular';
import { HttpErrorResponse } from '@angular/common/http';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { Contacts, Contact, ContactField, ContactName } from '@ionic-native/contacts/ngx';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { IPerson } from 'src/app/lib/interfaces';
import { AlertService } from 'src/app/services/alert/alert.service';
import { UPLoginProvider } from 'src/app/services/login-provider/login';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';
import { IPersonsRequestParams } from '../../services/webservice-wrapper/webservice-definition-interfaces';

@Component({
  selector: 'app-person-search',
  templateUrl: './person-search.page.html',
  styleUrls: ['./person-search.page.scss'],
})
export class PersonSearchPage extends AbstractPage {

  personsFound: IPerson[] = [];
  response_received: boolean;
  error: HttpErrorResponse;
  query = '';
  noResults = false;
  triedRefreshingSession = false;
  cordova = false;

  constructor(
    private platform: Platform,
    private keyboard: Keyboard,
    // tslint:disable-next-line: deprecation
    private contacts: Contacts,
    private callNumber: CallNumber,
    private alertService: AlertService,
    private login: UPLoginProvider,
    private ws: WebserviceWrapperService
  ) {
    super({ requireNetwork: true, requireSession: true });
    if (this.platform.is('cordova')) {
      this.cordova = true;
    }
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

      this.logger.debug('search', `searching for \"${query}\"`);

      if (!this.session) { this.session = await this.sessionProvider.getSession(); }

      this.ws.call(
        'personSearch',
        <IPersonsRequestParams>{
          query: query,
          session: this.session
        }
      ).subscribe(
        (personsList: IPerson[]) => {
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
        async response => {
          if (!this.triedRefreshingSession) {
            if (response.status === 401) {
              // refresh token expired; f.e. if user logs into a second device
              if (this.session.credentials && this.session.credentials.password && this.session.credentials.username) {
                this.logger.debug('search', 're-authenticating...');
                this.login.oidcLogin(this.session.credentials, this.config.authorization.oidc).subscribe(sessionRes => {
                  this.logger.debug('search', 're-authenticating successfull');
                  this.sessionProvider.setSession(sessionRes);
                  this.session = sessionRes;
                  this.triedRefreshingSession = true;
                  this.search();
                }, error => {
                  this.logger.error('search', 're-authenticating not possible', error);
                });
              }
            } else {
              this.error = response;
              this.response_received = true;
            }
          } else {
            this.error = response;
            this.response_received = true;
          }
        }
      );

      if (this.personsFound.length > 0) {
        this.noResults = false;
      } else { this.noResults = true; }

    } else {
      this.logger.debug('search', 'empty query');
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
        this.logger.debug('exportContact', 'contacts.find', response);
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
        } else { this.alertService.showToast('alert.contact-exists'); }
      }, error => {
        this.logger.error('exportContact', 'contacts.find', error);
        this.saveContact(contact);
      });
    }
  }

  saveContact(contact: Contact) {
    contact.save().then(
      () => {
        this.logger.debug('saveContact', contact);
        this.alertService.showToast('alert.contact-export-success');
      },
      (error: any) => {
        this.logger.error('saveContact', error);
        if (error.code && (error.code === 20 || error.code === '20')) {
          this.alertService.showToast('alert.permission-denied');
        } else {
          this.alertService.showToast('alert.contact-export-fail');
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
      .then(() => this.logger.debug('callContact', 'dialer launched'))
      .catch((error) => this.logger.error('callContact', error));
    } else {
      window.location.href = 'tel:' + number;
    }
  }

}
