import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import * as jquery from 'jquery';
import { Address, EmergencyCall } from 'src/app/lib/interfaces';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from 'src/app/services/webservice-wrapper/webservice-wrapper.service';
import { ConfigService } from 'src/app/services/config/config.service';
import { contains } from 'src/app/lib/util';
import { Keyboard } from '@capacitor/keyboard';
import { NavigatorService } from 'src/app/services/navigator/navigator.service';

@Component({
  selector: 'app-emergency',
  templateUrl: './emergency.page.html',
  styleUrls: ['./emergency.page.scss'],
})
export class EmergencyPage extends AbstractPage implements OnInit {
  jsonPath = '../../assets/json/emergency';
  displayedList: Array<EmergencyCall> = [];
  defaultList: Array<EmergencyCall> = [];
  isLoaded = true;
  query = '';

  constructor(
    private chRef: ChangeDetectorRef,
    private navigator: NavigatorService,
    private ws: WebserviceWrapperService
  ) {
    super({ optionalNetwork: true });
  }

  ngOnInit() {
    this.defaultList = ConfigService.emergency;
    this.initializeList();
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
    } else {
      this.query = '';
    }

    this.ws
      .call('emergencyCalls', {}, { forceRefresh: refresher !== undefined })
      .subscribe(
        (response: any) => {
          this.defaultList = response;
          this.initializeList();
          this.isLoaded = true;
          if (refresher && refresher.target) {
            refresher.target.complete();
          }
        },
        () => {
          this.defaultList = ConfigService.emergency;
          this.initializeList();
          this.isLoaded = true;
          if (refresher && refresher.target) {
            refresher.target.complete();
          }
        }
      );
  }

  // hides keyboard once the user is scrolling
  onScrollListener() {
    if (this.platform.is('ios') || this.platform.is('android')) {
      Keyboard.hide();
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
        this.displayedList = jquery.grep(this.defaultList, (emergencyCall) =>
          contains(emergencyCall.name, query)
        );
        this.chRef.detectChanges();
      }
    }
  }

  getEmergencyAddress(address: Address) {
    let addressString = '';

    if (address.street) {
      addressString += address.street;
    }

    if (address.postal) {
      if (addressString !== '') {
        addressString += ', ';
      }

      addressString += address.postal;
    }

    return addressString;
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

    this.navigator.navigateToAddress(location);
  }

  openMail(mail) {
    window.location.href = 'mailto:' + mail;
  }

  /**
   * @name callContact
   * @description using native call for calling numbers
   * @param {string} number
   */
  callContact(num: string) {
    window.location.href = 'tel:' + num;
  }
}
