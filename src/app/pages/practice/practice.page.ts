import { Component, ChangeDetectorRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  IonItemSliding,
  ModalController,
  AlertController,
} from '@ionic/angular';
import * as jquery from 'jquery';
import { TranslateService } from '@ngx-translate/core';
import { DetailedPracticeModalPage } from './detailed-practice.modal';
import { ADS, IADSResponse } from 'src/app/lib/interfaces';
import { SettingsService } from 'src/app/services/settings/settings.service';
import { AlertService } from 'src/app/services/alert/alert.service';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';
import { contains, isInArray } from 'src/app/lib/util';
import { Keyboard } from '@capacitor/keyboard';
import { Storage } from '@capacitor/storage';

@Component({
  selector: 'app-practice',
  templateUrl: './practice.page.html',
  styleUrls: ['./practice.page.scss'],
})
export class PracticePage extends AbstractPage {
  defaultList: ADS[] = [];
  filteredList: ADS[] = [];
  displayedList: ADS[] = [];
  displayedFavorites: ADS[] = [];
  allFavorites: ADS[] = [];
  isLoaded;
  error: HttpErrorResponse;
  itemsShown = 0;
  isLoadedFavorites = false;
  query = '';
  activeSegment = 'search';
  modalOpen;

  constructor(
    private settingsProvider: SettingsService,
    public translate: TranslateService,
    private chRef: ChangeDetectorRef,
    private alertService: AlertService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
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
    this.displayedFavorites = this.allFavorites;
  }

  /**
   * @name loadData
   * @async
   * @description loads default items from json file
   * @param refresher
   */
  public loadData(refresher?) {
    this.error = null;
    if (!(refresher && refresher.target)) {
      this.isLoaded = false;
    } else {
      this.query = '';
    }

    this.ws
      .call('practiceSearch', {}, { forceRefresh: refresher !== undefined })
      .subscribe(
        (response: IADSResponse) => {
          if (refresher && refresher.target) {
            refresher.target.complete();
          }

          // reset array so new persons are displayed
          this.defaultList = [];
          // use inner object only because it's wrapped in another object
          const uidArray = [];
          for (const ads of response) {
            ads.date = ads.date * 1000;
            ads.expanded = false;
            if (!isInArray(uidArray, ads.uid)) {
              uidArray.push(ads.uid);
              this.defaultList.push(ads);
            }
          }
          this.initializeList();
          this.useFilterSettings().then(() => {
            this.isLoaded = true;
          });
          this.checkFavorites();
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
        this.filteredList = jquery.grep(
          this.filteredList,
          (ADS1) => contains(ADS1.title, query) || contains(ADS1.firm, query)
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
          (ADS2) => contains(ADS2.title, query) || contains(ADS2.firm, query)
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
    const isFav = isInArray(this.allFavorites, ads);
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: DetailedPracticeModalPage,
      componentProps: { ADS: ads, isFavorite: isFav },
    });
    modal.present();
    this.modalOpen = true;
    const result = await modal.onWillDismiss();
    if (result && result.data) {
      if (isFav !== result.data.isFavoriteNew) {
        if (result.data.isFavoriteNew) {
          this.makeFavorite(ads, undefined, true);
        } else {
          this.removeFavorite(ads, true);
        }
      }
    }
    this.modalOpen = false;
  }

  /**
   * @name makeFavorite
   * @description set favorite and save to storage
   * @param {ADS} ads
   * @param {ItemSliding} slidingItem
   */
  async makeFavorite(
    ads: ADS,
    slidingItem: IonItemSliding,
    disableHints?: boolean
  ) {
    if (!isInArray(this.displayedFavorites, ads)) {
      this.displayedFavorites.push(ads);

      if (!isInArray(this.allFavorites, ads)) {
        this.allFavorites.push(ads);
      }
      if (!disableHints) {
        this.alertService.showToast('hints.text.favAdded');
      }
    } else {
      if (!disableHints) {
        this.alertService.showToast('hints.text.favExists');
      }
    }

    await Storage.set({
      key: 'favoriteJobs',
      value: JSON.stringify(this.allFavorites),
    });

    if (slidingItem) {
      slidingItem.close();
    }
  }

  /**
   * @name removeFavorite
   * @description removes favorites
   * @param {ADS} ads
   */
  async removeFavorite(ads: ADS, disableHints?: boolean) {
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
      this.alertService.showToast('hints.text.favRemoved');
    }
    await Storage.set({
      key: 'favoriteJobs',
      value: JSON.stringify(this.allFavorites),
    });
  }

  /**
   * @name checkFavorites
   * @async
   * @description checks if favorites are still valid
   */
  async checkFavorites() {
    const tmpObj = await Storage.get({ key: 'favoriteJobs' });
    const tmp: ADS[] = JSON.parse(tmpObj.value);

    this.allFavorites = [];
    this.displayedFavorites = [];
    if (tmp) {
      let i;
      let j;
      for (i = 0; i < tmp.length; i++) {
        for (j = 0; j < this.defaultList.length; j++) {
          if (tmp[i].uid === this.defaultList[j].uid) {
            if (!isInArray(this.allFavorites, tmp[i])) {
              this.allFavorites.push(tmp[i]);
            }
            break;
          }
        }
      }

      if (tmp.length > this.allFavorites.length) {
        this.alertService.showToast('hints.text.favNotAvailable');
      }
    }

    this.isLoadedFavorites = true;
    this.displayedFavorites = this.allFavorites;
    await Storage.set({
      key: 'favoriteJobs',
      value: JSON.stringify(this.allFavorites),
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

  async clearAllFavorites() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('alert.title.clearAll'),
      message: this.translate.instant('alert.deleteAllFavs'),
      backdropDismiss: false,
      buttons: [
        {
          text: this.translate.instant('button.no'),
        },
        {
          text: this.translate.instant('button.yes'),
          handler: async () => {
            this.displayedFavorites = [];
            this.allFavorites = [];
            await Storage.set({
              key: 'favoriteJobs',
              value: JSON.stringify(this.allFavorites),
            });
          },
        },
      ],
    });
    alert.present();
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
    let tmpFav = this.displayedFavorites;
    // filter according to practice option
    if (practice.length > 0) {
      tmp = jquery.grep(tmp, (ADS1) => {
        let key = '';
        if (ADS1 && ADS1.art) {
          key = this.practiceMapping(ADS1.art);
        }
        return practice.includes(key);
      });

      tmpFav = jquery.grep(tmpFav, (ADS2) => {
        let key = '';
        if (ADS2 && ADS2.art) {
          key = this.practiceMapping(ADS2.art);
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

      tmpFav = jquery.grep(tmpFav, (ADS4) => {
        let key = '';
        if (ADS4 && ADS4.field) {
          key += ADS4.field;
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

      tmpFav = jquery.grep(tmpFav, (ADS6) => {
        if (ADS6.foreign === '0') {
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

      tmpFav = jquery.grep(tmpFav, (ADS8) => {
        if (ADS8.foreign === '1') {
          return true;
        } else {
          return false;
        }
      });
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
