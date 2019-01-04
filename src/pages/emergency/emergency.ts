import {
  Component,
  ChangeDetectorRef
} from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  Platform
} from 'ionic-angular';
import {
  EmergencyCall
} from "../../library/interfaces";
import * as jquery from "jquery";
import { Keyboard } from "@ionic-native/keyboard";
import { WebIntentProvider } from '../../providers/web-intent/web-intent';
import { LaunchNavigator } from '@ionic-native/launch-navigator';

/**
 * @class EmergencyPage
 * @classdesc Class for a page that shows EmergencyCall entries. The list of items can
 * be filtered by using a searchbox.
 */
@IonicPage()
@Component({
  selector: 'page-emergency',
  templateUrl: 'emergency.html'
})
export class EmergencyPage {

  jsonPath: string = "../../assets/json/emergency";
  displayedList: Array < EmergencyCall > ;
  defaultList: Array < EmergencyCall > ;

  /**
   * @constructor
   * @description Constructor of EmergencyPage
   *
   * @param {NavController} navCtrl
   * @param {NavParams} navParams
   * @param {Keyboard} keyboard
   * @param {ChangeDetectorRef} chRef
   * @param {Platform} platform
   * @param {WebIntentProvider} webIntent
   * @param {LaunchNavigator} launchNavigator
   */
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private keyboard: Keyboard,
    private chRef: ChangeDetectorRef,
    private platform: Platform,
    private webIntent: WebIntentProvider,
    private launchNavigator: LaunchNavigator) {
    this.loadData();
    this.initializeList();
  };


  /**
   * @name  initializeList
   * @description initializes the list that is to be displayed with default values
   */
  public initializeList(): void {
    this.displayedList = this.defaultList;
  }


  /**
   * @name loadData
   * @description loads default items from json file
   */
  public loadData(): void {
    this.defaultList = require("../../assets/json/emergency");
  }


  // hides keyboard once the user is scrolling
  onScrollListener() {
    if (this.platform.is("cordova") && (this.platform.is("ios") || this.platform.is("android"))) {
      this.keyboard.hide();
    }
  }


  /**
   * @name contains
   * @description checks, whether y is a substring of x
   *
   * @param {string} x - String that does or does not contain string y
   * @param {string} y - String that is or is not contained in string y
   * @returns {Boolean} - Whether string x contains string y
   */
  private contains(x: string, y: string): boolean {
    return x.toLowerCase().includes(y.toLowerCase());
  }


  /**
   * @name filterItems
   * @description when a query is typed into the searchbar this method is called. It
   * filters the complete list of items with the query and modifies the
   * displayed list accordingly.
   *
   * @param {string} query - a query string the items will be filtered with
   */
  public filterItems(query: string): void {
    this.initializeList();

    if (query) {
      this.displayedList = jquery.grep(
        this.defaultList,
        (emergencyCall, index) => {
          return this.contains(emergencyCall.name, query);
        }
      );
      this.chRef.detectChanges();
    }
  }


  /**
   * @name expand
   * @description toggles the expand value of one item to be expanded in the view
   *
   * @param {EmergencyCall} emergencyCall
   */
  expand(emergencyCall: EmergencyCall) {
    for (let i = 0; i < this.displayedList.length; i++) {
      let currentCall = this.displayedList[i];
      if (currentCall.name == emergencyCall.name) {
        currentCall.expanded = !currentCall.expanded;
      }
    }
  }

  /**
   * @name callMap
   * @description opens the map
   *
   * @param {EmergencyCall} emergencyCall
   */
  callMap(emergencyCall: EmergencyCall) {
    let location = emergencyCall.address.street + ' ' + emergencyCall.address.postal;

    this.launchNavigator.navigate(location).then(
      success => console.log('Launched navigator'),
      error => {
        console.log('Error launching navigator', error)
        location = location.replace(/\s/g, '+');
        this.webIntent.handleWebIntentForWebsite('https://www.google.com/maps/place/'+location);
      }
    );
  }
}