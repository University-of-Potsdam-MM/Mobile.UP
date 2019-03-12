import { Component, ChangeDetectorRef } from '@angular/core';
import { HttpErrorResponse, HttpHeaders, HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { CacheService } from 'ionic-cache';
import { Platform, NavController, IonItemSliding, ToastController, ModalController } from '@ionic/angular';
import * as jquery from 'jquery';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { TranslateService } from '@ngx-translate/core';
import { DetailedPracticeModalPage } from './detailed-practice.modal';
import { ADS, IConfig, IADSResponse } from 'src/app/lib/interfaces';
import { SettingsService } from 'src/app/services/settings/settings.service';
import { ConfigService } from 'src/app/services/config/config.service';
import { utils } from 'src/app/lib/util';

@Component({
  selector: 'app-practice',
  templateUrl: './practice.page.html',
  styleUrls: ['./practice.page.scss'],
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
  query;
  activeSegment = 'search';

  constructor(
    private storage: Storage,
    private cache: CacheService,
    private platform: Platform,
    private settingsProvider: SettingsService,
    private http: HttpClient,
    private keyboard: Keyboard,
    private translate: TranslateService,
    private navCtrl: NavController,
    private chRef: ChangeDetectorRef,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController
  ) { }

  ionViewWillEnter() {
    this.initializeList();
    this.loadData();
  }

  /**
   * @name practiceMapping
   * @description maps numbers to practices, since practices are provided by number by the API
   * @param num
   */
  private practiceMapping(num) {
    let practice = '';
    switch (num) {
      case '1':
        practice = 'Praktika';
        break;
      case '2':
        practice = 'Jobs für Studierende';
        break;
      case '3':
        practice = 'Jobs für Absolventen';
        break;
      case '4':
        practice = 'Abschlussarbeit';
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

  /**
   * @name loadData
   * @async
   * @description loads default items from json file
   * @param refresher
   */
  public loadData(refresher?) {

    const config: IConfig = ConfigService.config;

    const headers: HttpHeaders = new HttpHeaders()
    .append('Authorization', config.webservices.apiToken);

    const request = this.http.get(config.webservices.endpoint.practiceSearch, {headers: headers});

    if (refresher) {
      this.cache.removeItem('practiceResponse');
    } else {
      this.isLoaded = false;
    }

    this.cache.loadFromObservable('practiceResponse', request).subscribe(
      (response: IADSResponse) => {
        if (refresher) {
          refresher.target.complete();
        }

        // reset array so new persons are displayed
        this.defaultList = [];
        // use inner object only because it's wrapped in another object
        const uidArray = [];
        for (const ads of response) {
          // console.log(ads);
          ads.date = ads.date * 1000;
          ads.expanded = false;
          if (!utils.isInArray(uidArray, ads.uid)) {
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
          refresher.target.complete();
        }
        // reset array so new persons are displayed
        this.defaultList = [];
        this.error = error;
        // console.log(error);
        this.isLoaded = true;
      }
    );

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
    if (this.platform.is('cordova') && (this.platform.is('ios') || this.platform.is('android'))) {
      this.keyboard.hide();
    }
  }

  /**
   * @name useFilterSettings
   * @async
   * @description filters displayedList according to the preferences of the user
   */
  private async useFilterSettings() {

    const studyarea = await this.settingsProvider.getSettingValue('studyarea');
    const practice = await this.settingsProvider.getSettingValue('practice');
    const domestic = await this.settingsProvider.getSettingValue('domestic');
    const foreign = await this.settingsProvider.getSettingValue('foreign');

    // console.log(domestic, foreign);

    // console.log("FILTER");
    // console.log(studyarea);
    // console.log(practice);
    // console.log(this.displayedList);

    // console.log("DISPLAYED")
    // console.log(this.displayedList.length);

    let tmp = this.filteredList;
    let tmpFav = this.displayedFavorites;
    // filter according to practice option
    if (practice.length > 0) {
      tmp = jquery.grep(
        tmp, (ADS1) => {
          return practice.includes(this.practiceMapping(ADS1.art));
        }
      );

      tmpFav = jquery.grep(
        tmpFav, (ADS2) => {
          return practice.includes(this.practiceMapping(ADS2.art));
        }
      );
    }

    // filter according to studyarea
    if (studyarea.length > 0) {
      tmp = jquery.grep(
        tmp, (ADS3) => {
          return studyarea.includes(ADS3.field);
        }
      );

      tmpFav = jquery.grep(
        tmpFav, (ADS4) => {
          return studyarea.includes(ADS4.field);
        }
      );
    }

    if (domestic && !foreign) {
      tmp = jquery.grep(
        tmp, (ADS5) => {
          if (ADS5.foreign === '0') {
            return true;
          } else { return false; }
        }
      );

      tmpFav = jquery.grep(
        tmpFav, (ADS6) => {
          if (ADS6.foreign === '0') {
            return true;
          } else { return false; }
        }
      );
    } else if (foreign && !domestic) {
      tmp = jquery.grep(
        tmp, (ADS7) => {
          if (ADS7.foreign === '1') {
            return true;
          } else { return false; }
        }
      );

      tmpFav = jquery.grep(
        tmpFav, (ADS8) => {
          if (ADS8.foreign === '1') {
            return true;
          } else { return false; }
        }
      );
    }

    this.filteredList = tmp;
    this.displayedFavorites = tmpFav;

    let i;
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
          (ADS1) => {
            return this.contains(ADS1.title, query) || this.contains(ADS1.firm, query);
          }
        );

        let i;
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
          (ADS2) => {
            return this.contains(ADS2.title, query) || this.contains(ADS2.firm, query);
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
  openSettings() {
    this.navCtrl.navigateForward('/settings');
  }

  /**
   * @name itemSelected
   * @param {ADS} ads     ads-item to be passed to detail page
   */
  async itemSelected(ads: ADS) {
    const isFavorite = utils.isInArray(this.allFavorites, ads);
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: DetailedPracticeModalPage,
      componentProps: { ADS: ads, isFavorite: isFavorite }
    });
    modal.present();
    const result = await modal.onWillDismiss();
    if (isFavorite !== result.data.isFavoriteNew) {
      if (result.data.isFavoriteNew) {
        this.makeFavorite(ads, undefined, true);
      } else {
        this.removeFavorite(ads, true);
      }
    }
  }

  /**
   * @name makeFavorite
   * @description set favorite and save to storage
   * @param {ADS} ads
   * @param {ItemSliding} slidingItem
   */
  makeFavorite(ads: ADS, slidingItem: IonItemSliding, disableHints?: boolean) {
    if (!utils.isInArray(this.displayedFavorites, ads)) {
      this.displayedFavorites.push(ads);

      if (!utils.isInArray(this.allFavorites, ads)) {
        this.allFavorites.push(ads);
      }
      if (!disableHints) {
        this.presentToast(this.translate.instant('hints.text.favAdded'));
      }
    } else {
      if (!disableHints) {
        this.presentToast(this.translate.instant('hints.text.favExists'));
      }
    }

    this.storage.set('favoriteJobs', this.allFavorites);

    if (slidingItem) {
      slidingItem.close();
    }
  }

  /**
   * @name removeFavorite
   * @description removes favorites
   * @param {ADS} ads
   */
  removeFavorite(ads: ADS, disableHints?: boolean) {
    let i;
    const tmp: ADS[] = [];
    for (i = 0; i < this.allFavorites.length; i++) {
      if (this.allFavorites[i] !== ads) {
        tmp.push(this.allFavorites[i]);
      }
    }

    const tmp2: ADS[] = [];
    for (i = 0; i < this.displayedFavorites.length; i++) {
      if (this.displayedFavorites[i] !== ads) {
        tmp2.push(this.displayedFavorites[i]);
      }
    }
    this.allFavorites = [];
    this.allFavorites = tmp;
    this.displayedFavorites = [];
    this.displayedFavorites = tmp2;
    if (!disableHints) {
      this.presentToast(this.translate.instant('hints.text.favRemoved'));
    }
    this.storage.set('favoriteJobs', this.allFavorites);
  }

  /**
   * @name checkFavorites
   * @async
   * @description checks if favorites are still valid
   */
  async checkFavorites() {
    const tmp: ADS[] = await this.storage.get('favoriteJobs');

    this.allFavorites = [];
    this.displayedFavorites = [];
    if (tmp) {
      let i, j;
      for (i = 0; i < tmp.length; i++) {
        for (j = 0; j < this.defaultList.length; j++) {
          if (tmp[i].uid === this.defaultList[j].uid) {
            if (!utils.isInArray(this.allFavorites, tmp[i])) {
              this.allFavorites.push(tmp[i]);
            }
            break;
          }
        }
      }

      if (tmp.length > this.allFavorites.length) {
        this.presentToast(this.translate.instant('hints.text.favNotAvailable'));
      }
    }

    this.displayedFavorites = this.allFavorites;
    this.storage.set('favoriteJobs', this.allFavorites);
  }

  /**
   * @name presentToast
   * @param message
   */
  async presentToast(message) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      position: 'top',
      cssClass: 'toastPosition'
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
      let i, j;
      j = 0;
      for (i = this.itemsShown; i < (this.itemsShown + 10); i++) {
        if (this.filteredList[i]) {
          this.displayedList.push(this.filteredList[i]);
          j++;
        }
      }
      this.itemsShown += j;
      infiniteScroll.target.complete();
    }, 500);
  }

}
