import { Component,ChangeDetectorRef } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform, ItemSliding, ToastController } from 'ionic-angular';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Storage } from "@ionic/storage";
import { IConfig, IADSResponse, ADS } from "../../library/interfaces";
import * as jquery from "jquery";
import { CacheService } from 'ionic-cache';
import { Keyboard } from '@ionic-native/keyboard';
import { SettingsPage } from '../../pages/settings/settings';
import { DetailedPracticePage } from '../detailed-practice/detailed-practice';
import { SettingsProvider } from '../../providers/settings/settings';
import { ImpressumPage } from '../impressum/impressum';
import { TranslateService } from '@ngx-translate/core';

@IonicPage()
@Component({
  selector: 'page-practice',
  templateUrl: 'practice.html',
})
export class PracticePage {

  defaultList: ADS[] = [];
  filteredList: ADS[] = [];
  displayedList: ADS[] = [];
  displayedFavorites: ADS[] = [];
  allFavorites: ADS[] = [];
  isLoaded;
  error: HttpErrorResponse;
  itemsShown = 0;

  /**
   * Constructor of EmergencyPage
   * @param {NavController} navCtrl
   * @param {HttpClient} http
   * @param {Storage} storage
   */
  constructor(
    public navCtrl: NavController,
    private http: HttpClient,
    private storage: Storage,
    private toastCtrl: ToastController,
    private platform: Platform,
    private translate: TranslateService,
    private keyboard: Keyboard,
    private cache: CacheService,
    public navParams: NavParams,
    private settingsProvider: SettingsProvider,
    private chRef: ChangeDetectorRef) {
  };

  /**
   * @name practiceMapping
   * @description maps numbers to practices, since practices are provided by number by the API
   * @param num
   */
  private practiceMapping(num) {
    var practice ="";
    switch (num) {
      case "1":
        practice = "Praktika";
        break;
      case "2":
        practice = "Jobs für Studierende";
        break;
      case "3":
        practice = "Jobs für Absolventen";
        break;
      case "4":
        practice = "Abschlussarbeit";
        break;
    }
    return practice;
  }

  /**
   * @name initializeList
   */
  public initializeList(): void {
    this.filteredList = this.defaultList;
    this.displayedFavorites = this.allFavorites;
  }

  ionViewWillEnter() {
    let lastPage = this.navCtrl.last();
    if (lastPage.component != DetailedPracticePage && lastPage.component != ImpressumPage) {
      this.initializeList();
      this.loadData();
    }
  }

  /**
   * @name loadData
   * @async
   * @description loads default items from json file
   * @param refresher
   */
  public async loadData(refresher?) {

    let config: IConfig = await this.storage.get("config");

    let headers: HttpHeaders = new HttpHeaders()
    .append("Authorization", config.webservices.apiToken);

    let request = this.http.get(config.webservices.endpoint.practiceSearch, {headers: headers})

    if (refresher) {
      this.cache.removeItem("practiceResponse");
    } else {
      this.isLoaded = false;
    }

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
        this.useFilterSettings().then((res) => {
          this.isLoaded = true;
        });
        this.checkFavorites();
      },
      error => {
        if (refresher) {
          refresher.complete();
        }
        // reset array so new persons are displayed
        this.defaultList = [];
        this.error = error;
        //console.log(error);
        this.isLoaded = true;
      }
    );

  }

  /**
   * @name isInArray
   * @description checks if value is in array
   * @param {Array} array
   * @param {any} value
   * @returns {boolean} whether value in array
   */

  isInArray(array, value): boolean {
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
   * @name contains
   * @description checks, whether y is a substring of x
   *
   * @param {string} x string that does or does not contain string y
   * @param {string} y string that is or is not contained in string y
   * @returns {boolean} whether string x contains string y
   */
  private contains(x: string, y: string): boolean {
    return x.toLowerCase().includes(y.toLowerCase());
  }

  /**
   * @name onScrollListener
   * @description hides keyboard once the user is scrolling
   */
  onScrollListener() {
    if (this.platform.is("cordova") && (this.platform.is("ios") || this.platform.is("android"))) {
      this.keyboard.hide();
    }
  }

  /**
   * @name useFilterSettings
   * @async
   * @description filters displayedList according to the preferences of the user
   */
  private async useFilterSettings() {

    var studyarea = await this.settingsProvider.getSettingValue("studyarea");
    var practice = await this.settingsProvider.getSettingValue("practice");
    var domestic = await this.settingsProvider.getSettingValue("domestic");
    var foreign = await this.settingsProvider.getSettingValue("foreign");

    // console.log(domestic, foreign);

    // console.log("FILTER");
    // console.log(studyarea);
    // console.log(practice);
    // console.log(this.displayedList);

    // console.log("DISPLAYED")
    // console.log(this.displayedList.length);

    var tmp = this.filteredList;
    var tmpFav = this.displayedFavorites;
    // filter according to practice option
    if (practice.length > 0) {
      tmp = jquery.grep(
        tmp, (ADS) => {
          return practice.includes(this.practiceMapping(ADS.art))
        }
      )

      tmpFav = jquery.grep(
        tmpFav, (ADS) => {
          return practice.includes(this.practiceMapping(ADS.art))
        }
      )
    }

    // filter according to studyarea
    if (studyarea.length > 0) {
      tmp = jquery.grep(
        tmp, (ADS) => {
          return studyarea.includes(ADS.field)
        }
      )

      tmpFav = jquery.grep(
        tmpFav, (ADS) => {
          return studyarea.includes(ADS.field)
        }
      )
    }

    if (domestic && !foreign) {
      tmp = jquery.grep(
        tmp, (ADS) => {
          if (ADS.foreign == "0") {
            return true;
          } else { return false; }
        }
      )

      tmpFav = jquery.grep(
        tmpFav, (ADS) => {
          if (ADS.foreign == "0") {
            return true;
          } else { return false; }
        }
      )
    } else if (foreign && !domestic) {
      tmp = jquery.grep(
        tmp, (ADS) => {
          if (ADS.foreign == "1") {
            return true;
          } else { return false; }
        }
      )

      tmpFav = jquery.grep(
        tmpFav, (ADS) => {
          if (ADS.foreign == "1") {
            return true;
          } else { return false; }
        }
      )
    }

    this.filteredList = tmp;
    this.displayedFavorites = tmpFav;

    var i;
    this.displayedList = [];
    this.itemsShown = 0;
    for (i = 0; i < 15; i++) {
      if (this.filteredList[i]) {
        this.displayedList.push(this.filteredList[i]);
        this.itemsShown++;
      }
    }

    // console.log("DISPLAYED NEW")
    // console.log(this.displayedList.length);
  }

  /**
   * @name filterItems
   * @description when a query is typed into the searchbar this method is called. It
   * filters the complete list of items with the query and modifies the
   * displayed list accordingly.
   *
   * @param query string A query string the items will be filtered with
   */
  public async filterItems(query: string) {
    this.isLoaded = false;
    this.initializeList();
    this.useFilterSettings().then(resolve => {
      if (query) {
        this.filteredList = jquery.grep(
          this.filteredList,
          (ADS, index) => {
            return this.contains(ADS.title, query)|| this.contains(ADS.firm, query);
          }
        );

        var i;
        this.displayedList = [];
        this.itemsShown = 0;
        for (i = 0; i < 15; i++) {
          if (this.filteredList[i]) {
            this.displayedList.push(this.filteredList[i]);
            this.itemsShown++;
          }
        }

        this.displayedFavorites = jquery.grep(
          this.displayedFavorites,
          (ADS, index) => {
            return this.contains(ADS.title, query) || this.contains(ADS.firm, query);
          }
        );
      }
    });
    this.isLoaded = true;
    this.chRef.detectChanges();
  }

  /**
   * @name openSettings
   * @description opens settings page
   */
  openSettings(){
    this.navCtrl.push(SettingsPage);
  }

  /**
   * @name itemSelected
   * @param {ADS} ads     ads-item to be passed to detail page
   */
  itemSelected(ads: ADS) {
    this.navCtrl.push(DetailedPracticePage, { "ADS": ads });
  }

  /**
   * @name makeFavorite
   * @description set favorite and save to storage
   * @param {ADS} ads
   * @param {ItemSliding} slidingItem
   */
  makeFavorite(ads: ADS, slidingItem:ItemSliding) {
    if (!this.isInArray(this.displayedFavorites, ads)) {
      this.displayedFavorites.push(ads);

      if (!this.isInArray(this.allFavorites, ads)) {
        this.allFavorites.push(ads);
      }
      this.presentToast(this.translate.instant("page.practice.favAdded"));
    } else {
      this.presentToast(this.translate.instant("page.practice.favExists"));
    }

    this.storage.set("favoriteJobs", this.allFavorites);

    slidingItem.close();
  }

  /**
   * @name removeFavorite
   * @description removes favorites
   * @param {ADS} ads
   */
  removeFavorite(ads:ADS) {
    var i;
    var tmp: ADS[] = [];
    for (i = 0; i < this.allFavorites.length; i++) {
      if (this.allFavorites[i] != ads) {
        tmp.push(this.allFavorites[i]);
      }
    }

    var tmp2: ADS[] = [];
    for (i = 0; i < this.displayedFavorites.length; i++) {
      if (this.displayedFavorites[i] != ads) {
        tmp2.push(this.displayedFavorites[i]);
      }
    }
    this.allFavorites = [];
    this.allFavorites = tmp;
    this.displayedFavorites = [];
    this.displayedFavorites = tmp2;
    this.presentToast(this.translate.instant("page.practice.favRemoved"));
    this.storage.set("favoriteJobs", this.allFavorites);
  }

  /**
   * @name checkFavorites
   * @async
   * @description checks if favorites are still valid
   */
  async checkFavorites() {
    var tmp:ADS[] = await this.storage.get("favoriteJobs");

    this.allFavorites = [];
    this.displayedFavorites = [];
    if (tmp) {
      var i, j;
      for (i = 0; i < tmp.length; i++) {
        for (j = 0; j < this.defaultList.length; j++) {
          if (tmp[i].uid == this.defaultList[j].uid) {
            if (!this.isInArray(this.allFavorites, tmp[i])) {
              this.allFavorites.push(tmp[i]);
            }
            break;
          }
        }
      }

      if (tmp.length > this.allFavorites.length) {
        this.presentToast(this.translate.instant("page.practice.favNotAvailable"));
      }
    }

    this.displayedFavorites = this.allFavorites;
    this.storage.set("favoriteJobs", this.allFavorites);
  }

  /**
   * @name presentToast
   * @param message
   */
  presentToast(message) {
    const toast = this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: "top",
      cssClass: "toastPosition"
    });
    toast.present();
  }

  /**
   * @name doInfinite
   * @description handle infinite scrolling
   * @param infiniteScroll
   */
  doInfinite(infiniteScroll) {

    setTimeout(() => {
      var i,j;
      j = 0;
      for (i = this.itemsShown; i < (this.itemsShown+10); i++) {
        if (this.filteredList[i]) {
          this.displayedList.push(this.filteredList[i])
          j++;
        }
      }
      this.itemsShown += j;
      infiniteScroll.complete();
    }, 500);

  }
}