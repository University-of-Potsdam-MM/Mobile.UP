import { Component, OnInit } from '@angular/core';
import * as xml2js from 'xml2js';
import {
  IonItemSliding,
  ModalController,
  AlertController,
} from '@ionic/angular';
import { IConfig } from 'src/app/lib/interfaces';
import { BookDetailModalPage } from 'src/app/components/book-list/book-detail.modal';
import { TranslateService } from '@ngx-translate/core';
import * as jquery from 'jquery';
import { AlertService } from 'src/app/services/alert/alert.service';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';
import { ILibraryRequestParams } from '../../services/webservice-wrapper/webservice-definition-interfaces';
import { contains, convertToArray, isInArray } from 'src/app/lib/util';
import { Storage } from '@capacitor/storage';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-library-search',
  templateUrl: './library-search.page.html',
  styleUrls: ['./library-search.page.scss'],
})
export class LibrarySearchPage extends AbstractPage implements OnInit {
  query;
  config: IConfig;
  startRecord = '1'; // hochsetzen beim nachladen von ergebnissen
  maximumRecords = '15'; // wie viele geladen werden
  activeSegment = 'search';

  isLoaded = false;
  isLoadedFavorites = false;
  bookList = [];
  displayedFavorites = [];
  allFavorites = [];
  numberOfRecords = '0';
  updatedFavorites = 0;
  modalOpen;
  networkError;

  constructor(
    private translate: TranslateService,
    private alertService: AlertService,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private ws: WebserviceWrapperService
  ) {
    super({ optionalNetwork: true });
  }

  ngOnInit() {
    this.checkFavorites();
  }

  // hides keyboard once the user is scrolling
  onScrollListener() {
    if (this.platform.is('ios') || this.platform.is('android')) {
      Keyboard.hide();
    }
  }

  searchLibrary(resetList: boolean, event?, infiniteScroll?) {
    if (event) {
      this.query = event.detail.value;
      this.query = this.query.replace(/\//g, ' ').trim();
    }

    const query = this.query.replace(/\//g, ' ').trim();

    if (this.activeSegment === 'search') {
      if (query.trim() !== '') {
        if (resetList) {
          this.bookList = [];
          this.startRecord = '1';
          this.numberOfRecords = '0';
          this.isLoaded = false;
        }

        this.ws
          .call(
            'library',
            {
              query: this.query.trim(),
              startRecord: this.startRecord,
              maximumRecords: this.maximumRecords,
            } as ILibraryRequestParams,
            {
              dontCache: true,
            }
          )
          .subscribe(
            (res) => {
              this.networkError = false;
              this.parseXMLtoJSON(res).then(
                (data) => {
                  let tmp;
                  let tmpList;
                  let i;
                  if (data['zs:searchRetrieveResponse']) {
                    tmp = data['zs:searchRetrieveResponse'];
                  }

                  if (tmp['zs:records']) {
                    tmpList = tmp['zs:records']['zs:record'];
                  }

                  if (tmp['zs:numberOfRecords']) {
                    this.numberOfRecords = tmp['zs:numberOfRecords'];
                  }

                  if (this.numberOfRecords === '1') {
                    tmpList = convertToArray(tmpList);
                  }

                  if (Array.isArray(tmpList)) {
                    for (i = 0; i < tmpList.length; i++) {
                      this.bookList.push(tmpList[i]['zs:recordData'].mods);
                    }
                  }

                  this.isLoaded = true;
                  if (infiniteScroll) {
                    infiniteScroll.target.complete();
                  }
                },
                (error) => {
                  // this.logger.error('searchLibrary XML parsing', error);
                  this.isLoaded = true;
                  if (infiniteScroll) {
                    infiniteScroll.target.complete();
                  }
                }
              );
            },
            () => {
              this.isLoaded = true;
              this.networkError = true;
              if (infiniteScroll) {
                infiniteScroll.target.complete();
              }
            }
          );
      } else {
        this.isLoaded = true;
      }
    } else {
      this.displayedFavorites = this.allFavorites;
      this.displayedFavorites = jquery.grep(this.displayedFavorites, (book) => {
        if (book && book.titleInfo) {
          const titleInfo = convertToArray(book.titleInfo)[0];

          let wholeTitle = '';
          if (titleInfo.title) {
            wholeTitle = titleInfo.title;
          }

          if (titleInfo.subTitle) {
            wholeTitle = wholeTitle + ' ' + titleInfo.subTitle;
          }

          if (titleInfo.nonSort) {
            wholeTitle = wholeTitle + ' ' + titleInfo.nonSort;
          }

          return contains(wholeTitle, query);
        } else {
          return false;
        }
      });
    }
  }

  parseXMLtoJSON(data) {
    const parser = new xml2js.Parser({ trim: true, explicitArray: false });

    return new Promise((resolve) => {
      parser.parseString(data, function (err, result) {
        resolve(result);
      });
    });
  }

  resultIndex() {
    if (Number(this.numberOfRecords) < Number(this.startRecord) + 14) {
      return this.numberOfRecords;
    } else {
      const s = '1 - ' + (Number(this.startRecord) + 14);
      return s;
    }
  }

  loadMore(infiniteScroll) {
    this.startRecord = String(Number(this.startRecord) + 15);
    if (Number(this.startRecord) <= Number(this.numberOfRecords)) {
      this.searchLibrary(false, undefined, infiniteScroll);
    } else {
      infiniteScroll.target.complete();
    }
  }

  isEnd() {
    if (Number(this.startRecord) <= Number(this.numberOfRecords)) {
      return false;
    } else {
      return true;
    }
  }

  async bookDetailView(bookToView) {
    const isFav = isInArray(this.allFavorites, bookToView);
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: BookDetailModalPage,
      componentProps: { book: bookToView, isFavorite: isFav },
    });
    modal.present();
    this.modalOpen = true;
    const result = await modal.onWillDismiss();
    if (result && result.data) {
      if (isFav !== result.data.isFavoriteNew) {
        if (result.data.isFavoriteNew) {
          this.makeFavorite(bookToView, undefined);
        } else {
          this.removeFavorite(bookToView);
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
  async makeFavorite(book, slidingItem: IonItemSliding) {
    if (!isInArray(this.displayedFavorites, book)) {
      this.displayedFavorites.push(book);
      this.displayedFavorites = this.sortFavorites(this.displayedFavorites);

      if (!isInArray(this.allFavorites, book)) {
        this.allFavorites.push(book);
        this.allFavorites = this.sortFavorites(this.allFavorites);
      }
    } else {
    }

    await Storage.set({
      key: 'favoriteBooks',
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
  async removeFavorite(ads) {
    let i;
    const tmp = [];
    for (i = 0; i < this.allFavorites.length; i++) {
      if (JSON.stringify(this.allFavorites[i]) !== JSON.stringify(ads)) {
        tmp.push(this.allFavorites[i]);
      }
    }

    const tmp2 = [];
    for (i = 0; i < this.displayedFavorites.length; i++) {
      if (JSON.stringify(this.displayedFavorites[i]) !== JSON.stringify(ads)) {
        tmp2.push(this.displayedFavorites[i]);
      }
    }

    this.allFavorites = [];
    this.allFavorites = this.sortFavorites(tmp);
    this.displayedFavorites = [];
    this.displayedFavorites = this.sortFavorites(tmp2);

    await Storage.set({
      key: 'favoriteBooks',
      value: JSON.stringify(this.allFavorites),
    });
  }

  async updateComplete(tmpLength, refresher) {
    if (tmpLength === this.updatedFavorites) {
      // this.logger.debug('updateComplete', 'updated favorites');
      this.allFavorites = this.sortFavorites(this.allFavorites);
      this.displayedFavorites = this.sortFavorites(this.allFavorites);
      this.isLoadedFavorites = true;
      await Storage.set({
        key: 'favoriteBooks',
        value: JSON.stringify(this.allFavorites),
      });
      if (tmpLength > this.allFavorites.length) {
        this.alertService.showToast('hints.text.favNotAvailable');
      }
    }

    if (refresher && refresher.target) {
      refresher.target.complete();
    }
  }

  /**
   * @name checkFavorites
   * @async
   * @description checks if favorites are still valid
   */
  async checkFavorites(refresher?) {
    const tmpObj = await Storage.get({ key: 'favoriteBooks' });
    const tmp = JSON.parse(tmpObj.value);

    this.displayedFavorites = [];
    this.allFavorites = [];
    this.isLoadedFavorites = false;
    this.updatedFavorites = 0;
    if (refresher) {
      this.query = '';
    }

    if (tmp && tmp.length > 0) {
      for (const tmpItem of tmp) {
        const ident = convertToArray(tmpItem.identifier);
        let favQuery = '';

        for (const idt of ident) {
          if (idt._) {
            favQuery = idt._;
            break;
          }
        }

        if (favQuery === '') {
          if (tmpItem && tmpItem.titleInfo) {
            let wholeTitle = '';
            const titleInfo = convertToArray(tmpItem.titleInfo)[0];

            if (titleInfo.nonSort) {
              wholeTitle = titleInfo.nonSort;
            }

            if (titleInfo.title) {
              wholeTitle = wholeTitle + ' ' + titleInfo.title;
            }

            if (titleInfo.subTitle) {
              wholeTitle = wholeTitle + ' ' + titleInfo.subTitle;
            }

            favQuery = wholeTitle.trim();
          }
        } else {
          favQuery = favQuery.split('(')[0].trim();
        }

        if (favQuery.trim() !== '') {
          this.ws
            .call(
              'library',
              {
                query: favQuery,
                startRecord: '1',
                maximumRecords: '5',
              } as ILibraryRequestParams,
              {
                groupKey: 'libraryFavoriteResource',
                forceRefreshGroup: refresher !== undefined,
              }
            )
            .subscribe(
              (res) => {
                this.networkError = false;
                this.parseXMLtoJSON(res).then(
                  (data) => {
                    let tmpRes;
                    let tmpList;
                    let numberOfRecords;
                    if (data['zs:searchRetrieveResponse']) {
                      tmpRes = data['zs:searchRetrieveResponse'];
                    }

                    if (tmpRes['zs:records']) {
                      tmpList = tmpRes['zs:records']['zs:record'];
                    }

                    if (tmpRes['zs:numberOfRecords']) {
                      numberOfRecords = tmpRes['zs:numberOfRecords'];
                    }

                    tmpList = convertToArray(tmpList);
                    if (numberOfRecords === '1') {
                      for (const tmpTwo of tmpList) {
                        this.allFavorites.push(tmpTwo['zs:recordData'].mods);
                        break;
                      }
                    } else {
                      if (tmpItem && tmpItem.identifier) {
                        for (const tmpThree of tmpList) {
                          if (
                            tmpThree &&
                            tmpThree['zs:recordData'].mods.identifier
                          ) {
                            if (
                              JSON.stringify(tmpItem.identifier) ===
                              JSON.stringify(
                                tmpThree['zs:recordData'].mods.identifier
                              )
                            ) {
                              this.allFavorites.push(
                                tmpThree['zs:recordData'].mods
                              );
                              break;
                            }
                          }
                        }
                      } else if (tmpItem && tmpItem.titleInfo) {
                        for (const tmpFour of tmpList) {
                          if (
                            tmpFour &&
                            tmpFour['zs:recordData'].mods.titleInfo
                          ) {
                            if (
                              JSON.stringify(
                                convertToArray(tmpItem.titleInfo)[0]
                              ) ===
                              JSON.stringify(
                                convertToArray(
                                  tmpFour['zs:recordData'].mods.titleInfo
                                )[0]
                              )
                            ) {
                              this.allFavorites.push(
                                tmpFour['zs:recordData'].mods
                              );
                              break;
                            }
                          }
                        }
                      } else {
                        this.allFavorites.push(tmpItem);
                      }
                    }

                    this.updatedFavorites++;
                    this.updateComplete(tmp.length, refresher);
                  },
                  (error) => {
                    this.allFavorites.push(tmpItem);
                    this.updatedFavorites++;
                    // this.logger.error('checkFavorites', 'XML parsing', error);
                    this.updateComplete(tmp.length, refresher);
                  }
                );
              },
              () => {
                this.networkError = true;
                this.allFavorites.push(tmpItem);
                this.updatedFavorites++;
                this.updateComplete(tmp.length, refresher);
              }
            );
        } else {
          this.allFavorites.push(tmpItem);
          this.updatedFavorites++;
          this.updateComplete(tmp.length, refresher);
          // this.logger.debug('checkFavorites', 'no identifier or title found');
        }
      }
    } else {
      this.isLoadedFavorites = true;
      if (refresher && refresher.target) {
        refresher.target.complete();
      }
    }
  }

  sortFavorites(favoritesArray) {
    favoritesArray = convertToArray(favoritesArray);
    return favoritesArray.sort((fav1, fav2) => {
      let wholeTitle = '';
      let wholeTitle2 = '';
      if (fav1 && fav1.titleInfo) {
        const titleInfo = convertToArray(fav1.titleInfo)[0];

        if (titleInfo.title) {
          wholeTitle = titleInfo.title;
        }

        if (titleInfo.subTitle) {
          wholeTitle = wholeTitle + ' ' + titleInfo.subTitle;
        }
      }

      if (fav2 && fav2.titleInfo) {
        const titleInfo = convertToArray(fav2.titleInfo)[0];

        if (titleInfo.title) {
          wholeTitle2 = titleInfo.title;
        }

        if (titleInfo.subTitle) {
          wholeTitle2 = wholeTitle2 + ' ' + titleInfo.subTitle;
        }
      }

      if (wholeTitle < wholeTitle2) {
        return -1;
      } else if (wholeTitle > wholeTitle2) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  async clearAllFavorites() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('alert.title.clearAll'),
      message: this.translate.instant('alert.deleteAllFavs'),
      backdropDismiss: false,
      mode: 'md',
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
              key: 'favoriteBooks',
              value: JSON.stringify(this.allFavorites),
            });
          },
        },
      ],
    });
    alert.present();
  }
}
