import { Component,ChangeDetectorRef } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Storage } from "@ionic/storage";
import { ISession } from "../../providers/login-provider/interfaces";
import { LoginPage } from "../login/login";
import {
  IConfig,
  IADSResponse,
  ADS
} from "../../library/interfaces";
import * as jquery from "jquery";
import { CacheService } from 'ionic-cache';
import { Keyboard } from '@ionic-native/keyboard';
import { SettingsPage } from '../../pages/settings/settings';
import { DetailedPracticePage } from '../detailed-practice/detailed-practice';


@IonicPage()
@Component({
  selector: 'page-practice',
  templateUrl: 'practice.html',
})
export class PracticePage {

  defaultList: ADS[] = [];
  displayedList: ADS[] = [];
  waiting_for_response: boolean = false;
  error: HttpErrorResponse;
  URLEndpoint: String = "https://www.uni-potsdam.de/abindiepraxis/download/";

  /**
   * Constructor of EmergencyPage
   * @param navCtrl
   * @param navParams
   */
  constructor(
    public navCtrl: NavController,
    private http: HttpClient,
    private storage: Storage,
    private platform: Platform,
    private keyboard: Keyboard,
    private cache: CacheService,
    public navParams: NavParams,
    private chRef: ChangeDetectorRef) {
  };

  public initializeList(): void {
    this.displayedList = this.defaultList;
  }

  async ngOnInit() {
    this.initializeList();
    this.loadData();
  }

  /**
   * loadData
   *
   * loads default items from json file
   */
  public async loadData(refresher?) {
    // reset array so new persons are displayed
    this.defaultList = [];

    if (refresher) {
      this.cache.removeItem("practiceResponse");
    } else {
      this.waiting_for_response = true;
    }

    console.log(`[PracticePage]: Quering ADS`);

    let session: ISession = await this.storage.get("session");
    let config: IConfig = await this.storage.get("config");
    if (session) {
      let headers: HttpHeaders = new HttpHeaders()
        .append("Authorization", config.webservices.apiToken);

      let request = this.http.get(config.webservices.endpoint.practiceSearch, {headers: headers})
      this.cache.loadFromObservable("practiceResponse", request).subscribe(
        (response: IADSResponse) => {
          if (refresher) {
            refresher.complete();
          }

          // reset array so new persons are displayed
          this.defaultList = [];
          // use inner object only because it's wrapped in another object
          var uidArray = [];
          for (let ads of response) {
            //console.log(ads);
            ads.date = ads.date*1000;
            ads.expanded = false;
            if (!this.isInArray(uidArray, ads.uid)) {
              uidArray.push(ads.uid);
              this.defaultList.push(ads);
            }
          }
          this.initializeList();
          this.waiting_for_response = false;
        },
        error => {
          if (refresher) {
            refresher.complete();
          }
          // reset array so new persons are displayed
          this.defaultList = [];
          this.error = error;
          console.log(error);
          this.waiting_for_response = false;
        }
      );
    } else {
      // send user to LoginPage if no session has been found
      this.navCtrl.push(LoginPage);
    }
  }

  isInArray(array, value) { // checks if value is in array
    var i;
    var found = false;
    for (i = 0; i < array.length; i++) {
      if (array[i] == value) {
        found = true;
      }
    }
    return found;
  }

  /**
   * contains
   *
   * checks, whether y is a substring of x
   *
   * @param x:string String that does or does not contain string y
   * @param y:string String that is or is not contained in string y
   * @returns boolean Whether string x contains string y
   */
  private contains(x: string, y: string): boolean {
    return x.toLowerCase().includes(y.toLowerCase());
  }

  // hides keyboard once the user is scrolling
  onScrollListener() {
    if (this.platform.is("cordova") && (this.platform.is("ios") || this.platform.is("android"))) {
      this.keyboard.hide();
    }
  }

  /**
   * filterItems
   *
   * when a query is typed into the searchbar this method is called. It
   * filters the complete list of items with the query and modifies the
   * displayed list accordingly.
   *
   * @param query:string A query string the items will be filtered with
   */
  public filterItems(query: string): void {
    this.initializeList();
    if (query) {
      this.displayedList = jquery.grep(
        this.defaultList,
        (ADS, index) => {
          return this.contains(ADS.title, query);
        }
      );
      this.chRef.detectChanges();
    }
  }

  openSettings(){
    this.navCtrl.push(SettingsPage);
  }

  itemSelected(ads, index) {
    this.navCtrl.push(DetailedPracticePage, { "ADS": ads, "list": this.displayedList[index] });
  }
}
