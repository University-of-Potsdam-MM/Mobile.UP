import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import * as jquery from 'jquery';
import { Contacts, Contact, ContactField, ContactName } from '@ionic-native/contacts/ngx';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { EmergencyCall } from 'src/app/lib/interfaces';
import { NavigatorService } from 'src/app/services/navigator/navigator.service';
import { AlertService } from 'src/app/services/alert/alert.service';
import { utils } from 'src/app/lib/util';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from 'src/app/services/webservice-wrapper/webservice-wrapper.service';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-emergency',
  templateUrl: './emergency.page.html',
  styleUrls: ['./emergency.page.scss'],
})
export class EmergencyPage  extends AbstractPage implements OnInit {

  jsonPath = '../../assets/json/emergency';
  displayedList: Array<EmergencyCall> = [];
  defaultList: Array<EmergencyCall> = [];
  isLoaded;
  cordova = false;
  query = '';

  constructor(
    private keyboard: Keyboard,
    private chRef: ChangeDetectorRef,
    private mapProvider: NavigatorService,
    // tslint:disable-next-line: deprecation
    private contacts: Contacts,
    private callNumber: CallNumber,
    private alertService: AlertService,
    private ws: WebserviceWrapperService,
  ) {
    super({ optionalNetwork: true });
  }

  ngOnInit() {
    if (this.platform.is('cordova')) {
      this.cordova = true;
    }

    this.loadEmergencyCalls();
  }

  /**
   * @name  initializeList
   * @description initializes the list that is to be displayed with default values
   */
  public initializeList(): void {
    this.displayedList = this.defaultList;
  }

  /**
   * @name loadEmergencyCalls
   * @description loads default items from json file
   */
  loadEmergencyCalls(refresher?) {

    if (!(refresher && refresher.target)) {
      this.isLoaded = false;
    } else { this.query = ''; }

    this.ws.call(
      'emergencyCalls',
      {},
      { forceRefresh: refresher !== undefined }
    ).subscribe((response: any) => {
      this.defaultList = response;
      this.initializeList();
      this.isLoaded = true;
      if (refresher && refresher.target) { refresher.target.complete(); }
    }, () => {
      this.defaultList = ConfigService.emergency;
      this.initializeList();
      this.isLoaded = true;
      if (refresher && refresher.target) { refresher.target.complete(); }
    });
  }


  // hides keyboard once the user is scrolling
  onScrollListener() {
    if (this.platform.is('cordova') && (this.platform.is('ios') || this.platform.is('android'))) {
      this.keyboard.hide();
    }
  }

  /**
   * @name filterItems
   * @description when a query is typed into the searchbar this method is called. It
   * filters the complete list of items with the query and modifies the
   * displayed list accordingly.
   * @param {string} query - a query string the items will be filtered with
   */
  filterItems(query) {
    this.initializeList();

    if (query && query.detail && query.detail.value) {
      query = query.detail.value;
      query = query.trim();

      if (query && query.length > 0) {
        this.displayedList = jquery.grep(
          this.defaultList,
          (emergencyCall, index) => {
            return utils.contains(emergencyCall.name, query);
          }
        );
        this.chRef.detectChanges();
      }
    }
  }

  /**
   * @name expand
   * @description toggles the expand value of one item to be expanded in the view
   * @param {EmergencyCall} emergencyCall
   */
  expand(emergencyCall: EmergencyCall) {
    for (let i = 0; i < this.displayedList.length; i++) {
      const currentCall = this.displayedList[i];
      if (currentCall.name === emergencyCall.name) {
        if (emergencyCall.description && emergencyCall.description === currentCall.description) {
          currentCall.expanded = !currentCall.expanded;
        } else if (!emergencyCall.description) {
          currentCall.expanded = !currentCall.expanded;
        }
      }
    }
  }

  /**
   * @name callMap
   * @description opens the map
   * @param {EmergencyCall} emergencyCall
   */
  callMap(emergencyCall: EmergencyCall) {
    let location = emergencyCall.address.street;
    if (emergencyCall.address.postal) {
      location += ' ' + emergencyCall.address.postal;
    }

    this.mapProvider.navigateToAdress(location);
  }


    /**
   * @name exportContact
   * @description exports a contact to the local phone book
   * @param {EmergencyCall} emergencyCall
   */
  exportContact(emergencyCall: EmergencyCall) {
    if (this.platform.is('cordova')) {
      const contact: Contact = this.contacts.create();

      contact.name = new ContactName(null, emergencyCall.name);

      if (emergencyCall.contact.telephone) { contact.phoneNumbers = [new ContactField('work', emergencyCall.contact.telephone)]; }
      if (emergencyCall.contact.mail)   { contact.emails = [new ContactField('work', emergencyCall.contact.mail)]; }
      if (emergencyCall.address && emergencyCall.address.street) {
        contact.addresses = [new ContactField()];
        if (contact.addresses && contact.addresses[0]) {
          contact.addresses[0].type = 'work';
          if (emergencyCall.address.postal) { contact.addresses[0].postalCode = emergencyCall.address.postal; }
          contact.addresses[0].streetAddress =  emergencyCall.address.street;
        }
      }

      const exportName = emergencyCall.name;
      this.contacts.find(['name'], { filter: exportName, multiple: true }).then(response => {
        this.logger.debug('exportContact', 'contacts.find', response);
        let contactFound = false;
        let contactID;
        for (let i = 0; i < response.length; i++) {
          let foundTel = false;
          let foundMail = false;
          let foundRoom = false;
          if (emergencyCall.contact.telephone && response[i].phoneNumbers.length > 0) {
            for (let j = 0; j < response[i].phoneNumbers.length; j++) {
              if (response[i].phoneNumbers[j].value === emergencyCall.contact.telephone) {
                foundTel = true;
                break;
              }
            }
          } else if (!emergencyCall.contact.telephone) { foundTel = true; }

          if (emergencyCall.contact.mail && response[i].emails.length > 0) {
            for (let j = 0; j < response[i].emails.length; j++) {
              if (response[i].emails[j].value === emergencyCall.contact.mail) {
                foundMail = true;
                break;
              }
            }
          } else if (!emergencyCall.contact.mail) { foundMail = true; }

          if (emergencyCall.address.street && response[i].addresses.length > 0) {
            for (let j = 0; j < response[i].addresses.length; j++) {
              if (response[i].addresses[j].streetAddress === emergencyCall.address.street) {
                foundRoom = true;
                break;
              }
            }
          } else if (!emergencyCall.address.street) { foundRoom = true; }

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
