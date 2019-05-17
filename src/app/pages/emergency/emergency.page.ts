import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import * as jquery from 'jquery';
import { Contacts, Contact, ContactField, ContactName } from '@ionic-native/contacts/ngx';
import { CallNumber } from '@ionic-native/call-number/ngx';
import { EmergencyCall } from 'src/app/lib/interfaces';
import { NavigatorService } from 'src/app/services/navigator/navigator.service';
import { TranslateService } from '@ngx-translate/core';
import { AlertService } from 'src/app/services/alert/alert.service';
import { utils } from 'src/app/lib/util';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from 'src/app/services/webservice-wrapper/webservice-wrapper.service';

@Component({
  selector: 'app-emergency',
  templateUrl: './emergency.page.html',
  styleUrls: ['./emergency.page.scss'],
})
export class EmergencyPage  extends AbstractPage implements OnInit {

  jsonPath = '../../assets/json/emergency';
  displayedList: Array<EmergencyCall>;
  defaultList: Array<EmergencyCall>;
  isLoaded;
  cordova = false;

  constructor(
    private platform: Platform,
    private keyboard: Keyboard,
    private chRef: ChangeDetectorRef,
    private mapProvider: NavigatorService,
    // tslint:disable-next-line: deprecation
    private contacts: Contacts,
    private callNumber: CallNumber,
    private alert: AlertService,
    private translate: TranslateService,
    private ws: WebserviceWrapperService
  ) {
    super({ requireNetwork: true });
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

    if (!refresher) {
      this.isLoaded = false;
    }

    this.ws.call(
      'emergencyCalls',
      {},
      {forceRefresh: refresher}
    ).subscribe((response) => {

      if (refresher) {
        refresher.target.complete();
      }

      this.defaultList = response;
      this.isLoaded = true;
      this.initializeList();
    });
    // on error //this.defaultList = require("../../assets/json/emergency");

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

    if (query) {
      query = query.detail.value;
      this.displayedList = jquery.grep(
        this.defaultList,
        (emergencyCall, index) => {
          return utils.contains(emergencyCall.name, query);
        }
      );
      this.chRef.detectChanges();
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
        contact.addresses[0].type = 'work';
        if (emergencyCall.address.postal) { contact.addresses[0].postalCode = emergencyCall.address.postal; }
        contact.addresses[0].streetAddress =  emergencyCall.address.street;
      }

      const exportName = emergencyCall.name;
      this.contacts.find(['name'], { filter: exportName, multiple: true }).then(response => {
        console.log(response);
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
