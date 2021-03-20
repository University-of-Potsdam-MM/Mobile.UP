import { Component, ChangeDetectorRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import * as jquery from 'jquery';
import { TranslateService } from '@ngx-translate/core';
import { ADS, IADSResponse } from 'src/app/lib/interfaces';
import { SettingsService } from 'src/app/services/settings/settings.service';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';
import { contains, isInArray } from 'src/app/lib/util';
import { Keyboard } from '@capacitor/keyboard';
import { Storage } from '@capacitor/storage';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-practice',
  templateUrl: './practice.page.html',
  styleUrls: ['./practice.page.scss'],
})
export class PracticePage extends AbstractPage {
  // holds all items
  defaultList: ADS[] = [];

  // holds all items that match the search query
  filteredList: ADS[] = [];

  // holds all items that match the search query
  // and are displayed as part of infinitescroll
  displayedList: ADS[] = [];
  itemsShown = 0;

  isLoaded;
  error: HttpErrorResponse;

  query = '';
  modalOpen;

  noFavoritesSet = true;
  onlyDisplayFavorites = false;

  constructor(
    private settingsProvider: SettingsService,
    public translate: TranslateService,
    private chRef: ChangeDetectorRef,
    private ws: WebserviceWrapperService
  ) {
    super({ optionalNetwork: true });
  }

  ionViewWillEnter() {
    this.initializeList();
    this.loadData();
  }

  /**
   * @name initializeList
   */
  public initializeList(): void {
    this.filteredList = this.defaultList;
  }

  /**
   * @name loadData
   * @async
   * @description loads default items from json file
   * @param refresher
   */
  async loadData(refresher?) {
    const favObj = await Storage.get({ key: 'favoriteJobs' });

    let favorizedJobs: ADS[] = [];
    // load favorites if there are any
    if (favObj && favObj.value) {
      favorizedJobs = JSON.parse(favObj.value);
    }

    this.error = null;
    if (!(refresher && refresher.target)) {
      this.isLoaded = false;
    } else {
      this.query = '';
    }

    this.ws
      .call('practiceSearch', {}, { forceRefresh: refresher !== undefined })
      .subscribe(
        async (response: IADSResponse) => {
          if (refresher && refresher.target) {
            refresher.target.complete();
          }

          // reset array so new persons are displayed
          this.defaultList = [];
          // use inner object only because it's wrapped in another object
          const uidArray = [];
          for (const ads of response) {
            ads.date = ads.date * 1000;
            if (!isInArray(uidArray, ads.uid)) {
              uidArray.push(ads.uid);
              this.defaultList.push(ads);
            }
          }

          const favorizedItemsThatStillExist: ADS[] = [];
          for (const itm of this.defaultList) {
            for (const favItm of favorizedJobs) {
              if (itm.uid === favItm.uid) {
                itm.isfavorite = true;
                favorizedItemsThatStillExist.push(itm);
                break;
              }
            }
          }

          if (favorizedItemsThatStillExist.length === 0) {
            this.noFavoritesSet = true;
            this.onlyDisplayFavorites = false;
          } else {
            this.noFavoritesSet = false;
          }

          await Storage.set({
            key: 'favoriteJobs',
            value: JSON.stringify(favorizedItemsThatStillExist),
          });

          this.initializeList();
          this.useFilterSettings().then(() => {
            this.isLoaded = true;
          });
        },
        (error) => {
          if (refresher && refresher.target) {
            refresher.target.complete();
          }
          // reset array so new persons are displayed
          this.defaultList = [];
          this.error = error;
          this.isLoaded = true;
        }
      );
  }

  /**
   * @name onScrollListener
   * @description hides keyboard once the user is scrolling
   */
  onScrollListener() {
    if (this.platform.is('ios') || this.platform.is('android')) {
      Keyboard.hide();
    }
  }

  toggleDisplayFavMode() {
    this.onlyDisplayFavorites = !this.onlyDisplayFavorites;
    this.filterItems(this.query);
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
    this.useFilterSettings().then(() => {
      if (query) {
        if (this.onlyDisplayFavorites) {
          this.filteredList = jquery.grep(
            this.filteredList,
            (ADS1: ADS) =>
              ADS1.isfavorite &&
              (contains(ADS1.title, query) || contains(ADS1.firm, query))
          );
        } else {
          this.filteredList = jquery.grep(
            this.filteredList,
            (ADS1: ADS) =>
              contains(ADS1.title, query) || contains(ADS1.firm, query)
          );
        }

        this.displayedList = [];
        this.itemsShown = 0;

        for (const potentialItm of this.filteredList) {
          if (this.displayedList.length === 15) {
            break;
          } else {
            this.displayedList.push(potentialItm);
            this.itemsShown++;
          }
        }
      } else if (this.onlyDisplayFavorites) {
        this.filteredList = jquery.grep(
          this.filteredList,
          (ADS1: ADS) => ADS1.isfavorite
        );

        this.displayedList = [];
        this.itemsShown = 0;

        for (const potentialItm of this.filteredList) {
          if (this.displayedList.length === 15) {
            break;
          } else {
            this.displayedList.push(potentialItm);
            this.itemsShown++;
          }
        }
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

  toggleFavorite(ads: ADS) {
    if (ads.isfavorite) {
      ads.isfavorite = false;
      this.removeFavorite(ads);
    } else {
      ads.isfavorite = true;
      this.makeFavorite(ads);
    }
  }

  /**
   * @name makeFavorite
   * @description set favorite and save to storage
   * @param {ADS} ads
   * @param {ItemSliding} slidingItem
   */
  async makeFavorite(ads) {
    const favObj = await Storage.get({ key: 'favoriteJobs' });

    let favorizedJobs: ADS[] = [];
    // load favorites if there are any
    if (favObj && favObj.value) {
      favorizedJobs = JSON.parse(favObj.value);
    }

    for (const listAds of this.defaultList) {
      if (listAds === ads) {
        // add new item to the fav array
        listAds.isfavorite = true;
        favorizedJobs.push(listAds);
      }
    }

    // apply changes to filteredList and displayedList
    this.initializeList();
    // this.useFilterSettings();

    if (favorizedJobs.length === 0) {
      this.noFavoritesSet = true;
      this.onlyDisplayFavorites = false;
    } else {
      this.noFavoritesSet = false;
    }

    // save fav array
    await Storage.set({
      key: 'favoriteJobs',
      value: JSON.stringify(favorizedJobs),
    });
  }

  /**
   * @name removeFavorite
   * @description removes favorites
   * @param {ADS} ads
   */
  async removeFavorite(ads: ADS) {
    const favObj = await Storage.get({ key: 'favoriteJobs' });
    const favorizedJobs: ADS[] = JSON.parse(favObj.value);
    const newFavorites: ADS[] = [];

    for (const savedFavItm of favorizedJobs) {
      if (savedFavItm.uid !== ads.uid) {
        // preserve all favorites except the one we remove
        newFavorites.push(savedFavItm);
      }
    }

    // set item in defaultList to non fav
    for (const itm of this.defaultList) {
      if (itm.uid === ads.uid) {
        itm.isfavorite = false;
      }
    }

    // apply changes to filteredList and displayedList
    this.initializeList();
    // this.useFilterSettings();

    if (newFavorites.length === 0) {
      this.noFavoritesSet = true;
      this.onlyDisplayFavorites = false;
    } else {
      this.noFavoritesSet = false;
    }

    await Storage.set({
      key: 'favoriteJobs',
      value: JSON.stringify(newFavorites),
    });
  }

  /**
   * @name doInfinite
   * @description handle infinite scrolling
   * @param infiniteScroll
   */
  doInfinite(infiniteScroll) {
    setTimeout(() => {
      let i;
      let j;
      j = 0;
      for (i = this.itemsShown; i < this.itemsShown + 10; i++) {
        if (this.filteredList[i]) {
          this.displayedList.push(this.filteredList[i]);
          j++;
        }
      }
      this.itemsShown += j;
      infiniteScroll.target.complete();
    }, 500);
  }

  getJobCategory(cat: string) {
    if (cat && cat !== '') {
      switch (cat) {
        case '1':
          return this.translate.instant('page.practice.item.praktika');
        case '2':
          return this.translate.instant('page.practice.item.student');
        case '3':
          return this.translate.instant('page.practice.item.graduate');
        case '4':
          return this.translate.instant('page.practice.item.thesis');
        default:
          return null;
      }
    } else {
      return null;
    }
  }

  getJobPostingURL(fileUrl: string) {
    if (fileUrl && fileUrl !== '') {
      return (
        ConfigService.config.webservices.endpoint.practiceJobPostings.url +
        fileUrl
      );
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

    let tmp = this.filteredList;
    // filter according to practice option
    if (practice.length > 0) {
      tmp = jquery.grep(tmp, (ADS1) => {
        let key = '';
        if (ADS1 && ADS1.art) {
          key = this.practiceMapping(ADS1.art);
        }
        return practice.includes(key);
      });
    }

    // filter according to studyarea
    if (studyarea.length > 0) {
      tmp = jquery.grep(tmp, (ADS3) => {
        let key = '';
        if (ADS3 && ADS3.field) {
          key += ADS3.field;
        }
        return studyarea.includes(key);
      });
    }

    if (domestic && !foreign) {
      tmp = jquery.grep(tmp, (ADS5) => {
        if (ADS5.foreign === '0') {
          return true;
        } else {
          return false;
        }
      });
    } else if (foreign && !domestic) {
      tmp = jquery.grep(tmp, (ADS7) => {
        if (ADS7.foreign === '1') {
          return true;
        } else {
          return false;
        }
      });
    }

    this.filteredList = tmp;

    let i;
    this.displayedList = [];
    this.itemsShown = 0;
    for (i = 0; i < 15; i++) {
      if (this.filteredList[i]) {
        this.displayedList.push(this.filteredList[i]);
        this.itemsShown++;
      }
    }
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
}
