import { Component, OnInit } from '@angular/core';
import * as xml2js from 'xml2js';
import { Platform, ModalController, IonItemSliding, AlertController } from '@ionic/angular';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { HttpHeaders, HttpParams, HttpClient } from '@angular/common/http';
import { IConfig } from 'src/app/lib/interfaces';
import { ConnectionService } from 'src/app/services/connection/connection.service';
import { ConfigService } from 'src/app/services/config/config.service';
import { WebHttpUrlEncodingCodec } from 'src/app/services/login-provider/lib';
import { BookDetailModalPage } from 'src/app/components/book-list/book-detail.modal';
import { utils } from 'src/app/lib/util';
import { TranslateService } from '@ngx-translate/core';
import { Storage } from '@ionic/storage';
import * as jquery from 'jquery';
import { AlertService } from 'src/app/services/alert/alert.service';
import { CacheService } from 'ionic-cache';

@Component({
  selector: 'app-library-search',
  templateUrl: './library-search.page.html',
  styleUrls: ['./library-search.page.scss'],
})
export class LibrarySearchPage implements OnInit {

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
  modalOpen = false;

  constructor(
    private connection: ConnectionService,
    private platform: Platform,
    private keyboard: Keyboard,
    private http: HttpClient,
    private modalCtrl: ModalController,
    private translate: TranslateService,
    private alert: AlertService,
    private storage: Storage,
    private cache: CacheService,
    private alertCtrl: AlertController
  ) { }

  ngOnInit() {
    this.connection.checkOnline(true, true);
    this.config = ConfigService.config;
    this.checkFavorites();
  }

  // hides keyboard once the user is scrolling
  onScrollListener() {
    if (this.platform.is('cordova') && (this.platform.is('ios') || this.platform.is('android'))) {
      this.keyboard.hide();
    }
  }

  searchLibrary(resetList: boolean, event?, infiniteScroll?) {
    if (event) {
      this.query = event.detail.value;
      this.query = this.query.trim();
    }

    const query = this.query.trim();

    if (this.activeSegment === 'search') {

      if (query.trim() !== '') {

        if (resetList) {
          this.bookList = [];
          this.startRecord = '1';
          this.numberOfRecords = '0';
          this.isLoaded = false;
        }

        const url = this.config.webservices.endpoint.library;

        const headers = new HttpHeaders()
          .append('Authorization', this.config.webservices.apiToken);

        const params = new HttpParams({encoder: new WebHttpUrlEncodingCodec()})
          .append('operation', 'searchRetrieve')
          .append('query', query.trim())
          .append('startRecord', this.startRecord)
          .append('maximumRecords', this.maximumRecords)
          .append('recordSchema', 'mods');

        this.http.get(url, {headers: headers, params: params, responseType: 'text'}).subscribe(res => {
          this.parseXMLtoJSON(res).then(data => {

            let tmp, tmpList, i;
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
              tmpList = utils.convertToArray(tmpList);
            }

            if (Array.isArray(tmpList)) {
              for (i = 0; i < tmpList.length; i++) {
                this.bookList.push(tmpList[i]['zs:recordData']['mods']);
              }
            }

            // console.log(this.numberOfRecords);
            // console.log(this.bookList);

            this.isLoaded = true;
            if (infiniteScroll) { infiniteScroll.target.complete(); }
          }, error => {
            console.log(error);
            this.isLoaded = true;
            if (infiniteScroll) { infiniteScroll.target.complete(); }
          });
        }, error => {
          console.log(error);
          this.isLoaded = true;
          if (infiniteScroll) { infiniteScroll.target.complete(); }
        });
      } else { this.isLoaded = true; }
    } else {
      this.displayedFavorites = this.allFavorites;
      this.displayedFavorites = jquery.grep(
        this.displayedFavorites, (book) => {
          if (book && book.titleInfo) {
            const titleInfo = utils.convertToArray(book.titleInfo)[0];

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

            return this.contains(wholeTitle, query);
          } else { return false; }
        }
      );
    }
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

  parseXMLtoJSON(data) {
    const parser = new xml2js.Parser({ trim: true, explicitArray: false });

    return new Promise(resolve => {
      parser.parseString(data, function(err, result) {
        resolve(result);
      });
    });
  }

  resultIndex() {
    if (Number(this.numberOfRecords) < (Number(this.startRecord) + 14)) {
      return this.numberOfRecords;
    } else {
      const s = '1 - ' + (Number(this.startRecord) + 14);
      return s;
    }
  }

  loadMore(infiniteScroll) {
    this.startRecord = String(Number(this.startRecord) + 15);
    // console.log(this.startRecord);
    // console.log(this.numberOfRecords);
    if (Number(this.startRecord) <= Number(this.numberOfRecords)) {
      this.searchLibrary(false, undefined, infiniteScroll);
    } else { infiniteScroll.target.complete(); }
  }

  isEnd() {
    if (Number(this.startRecord) <= Number(this.numberOfRecords)) {
      return false;
    } else { return true; }
  }

  async bookDetailView(book) {
    const isFavorite = utils.isInArray(this.allFavorites, book);
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: BookDetailModalPage,
      componentProps: { book: book, isFavorite: isFavorite }
    });
    modal.present();
    this.modalOpen = true;
    const result = await modal.onWillDismiss();
    if (isFavorite !== result.data.isFavoriteNew) {
      if (result.data.isFavoriteNew) {
        this.makeFavorite(book, undefined, true);
      } else {
        this.removeFavorite(book, true);
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
  makeFavorite(book, slidingItem: IonItemSliding, disableHints?: boolean) {
    if (!utils.isInArray(this.displayedFavorites, book)) {
      this.displayedFavorites.push(book);
      this.displayedFavorites = this.sortFavorites(this.displayedFavorites);

      if (!utils.isInArray(this.allFavorites, book)) {
        this.allFavorites.push(book);
        this.allFavorites = this.sortFavorites(this.allFavorites);
      }

      if (!disableHints) {
        this.alert.presentToast(this.translate.instant('hints.text.favAdded'));
      }
    } else {
      if (!disableHints) {
        this.alert.presentToast(this.translate.instant('hints.text.favExists'));
      }
    }

    this.storage.set('favoriteBooks', this.allFavorites);

    if (slidingItem) {
      slidingItem.close();
    }
  }

  /**
   * @name removeFavorite
   * @description removes favorites
   * @param {ADS} ads
   */
  removeFavorite(ads, disableHints?: boolean) {
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
    if (!disableHints) {
      this.alert.presentToast(this.translate.instant('hints.text.favRemoved'));
    }
    this.storage.set('favoriteBooks', this.allFavorites);
  }

  updateComplete(tmpLength, refresher) {
    if (tmpLength === this.updatedFavorites) {
      console.log('[Library]: Updated favorites.');
      this.allFavorites = this.sortFavorites(this.allFavorites);
      this.displayedFavorites = this.sortFavorites(this.allFavorites);
      this.isLoadedFavorites = true;
      this.storage.set('favoriteBooks', this.allFavorites);
      if (tmpLength > this.allFavorites.length) {
        this.alert.presentToast(this.translate.instant('hints.text.favNotAvailable'));
      }
    }

    if (refresher) {
      refresher.target.complete();
    }
  }

  /**
   * @name checkFavorites
   * @async
   * @description TODO: checks if favorites are still valid
   */
  async checkFavorites(refresher?) {
    const tmp = await this.storage.get('favoriteBooks');
    this.displayedFavorites = [];
    this.allFavorites = [];
    this.isLoadedFavorites = false;
    this.updatedFavorites = 0;

    if (refresher) {
      this.cache.removeItems('libraryFavoriteResource*');
    }

    if (tmp && tmp.length > 0) {
      for (let i = 0; i < tmp.length; i++) {
        // console.log(utils.convertToArray(tmp[i].identifier));
        const ident = utils.convertToArray(tmp[i].identifier);
        let query = '';

        for (let p = 0; p < ident.length; p++) {
          if (ident[p]._) {
            query = ident[p]._;
            break;
          }
        }

        if (query === '') {
          if (tmp[i] && tmp[i].titleInfo) {
            let wholeTitle = '';
            const titleInfo = utils.convertToArray(tmp[i].titleInfo)[0];

            if (titleInfo.nonSort) {
              wholeTitle = titleInfo.nonSort;
            }

            if (titleInfo.title) {
              wholeTitle = wholeTitle + ' ' + titleInfo.title;
            }

            if (titleInfo.subTitle) {
              wholeTitle = wholeTitle + ' ' + titleInfo.subTitle;
            }

            query = wholeTitle.trim();
          }
        } else {
          query = query.split('(')[0].trim();
        }

        if (query.trim() !== '') {
          const url = this.config.webservices.endpoint.library;

          const headers = new HttpHeaders()
            .append('Authorization', this.config.webservices.apiToken);

          const params = new HttpParams({encoder: new WebHttpUrlEncodingCodec()})
            .append('operation', 'searchRetrieve')
            .append('query', query.trim())
            .append('startRecord', '1')
            .append('maximumRecords', '5')
            .append('recordSchema', 'mods');

          const request = this.http.get(url, {headers: headers, params: params, responseType: 'text'});
          const ttl = 60 * 60 * 24 * 7; // TTL in seconds for one week
          this.cache.loadFromObservable('libraryFavoriteResource' + query, request, 'libraryFavoriteResource', ttl).subscribe(res => {
            this.parseXMLtoJSON(res).then(data => {
              let tmpRes, tmpList, numberOfRecords;
              if (data['zs:searchRetrieveResponse']) {
                tmpRes = data['zs:searchRetrieveResponse'];
              }

              if (tmpRes['zs:records']) {
                tmpList = tmpRes['zs:records']['zs:record'];
              }

              if (tmpRes['zs:numberOfRecords']) {
                numberOfRecords = tmpRes['zs:numberOfRecords'];
              }

              tmpList = utils.convertToArray(tmpList);
              if (numberOfRecords === '1') {
                for (let j = 0; j < tmpList.length; j++) {
                  this.allFavorites.push(tmpList[j]['zs:recordData']['mods']);
                  break;
                }
              } else {
                if (tmp[i] && tmp[i].identifier) {
                  // console.log('checking identifier');
                  for (let j = 0; j < tmpList.length; j++ ) {
                    if (tmpList[j] && tmpList[j]['zs:recordData']['mods'].identifier) {
                      if (JSON.stringify(tmp[i].identifier) === JSON.stringify(tmpList[j]['zs:recordData']['mods'].identifier)) {
                        this.allFavorites.push(tmpList[j]['zs:recordData']['mods']);
                        break;
                      }
                    }
                  }
                } else if (tmp[i] && tmp[i].titleInfo) {
                  // console.log('checking titleinfo');
                  for (let n = 0; n < tmpList.length; n++) {
                    if (tmpList[n] && tmpList[n]['zs:recordData']['mods'].titleInfo) {
                      if (JSON.stringify(utils.convertToArray(tmp[i].titleInfo)[0]) ===
                      JSON.stringify(utils.convertToArray(tmpList[n]['zs:recordData']['mods'].titleInfo)[0])) {
                        this.allFavorites.push(tmpList[n]['zs:recordData']['mods']);
                        break;
                      }
                    }
                  }
                } else { this.allFavorites.push(tmp[i]); }
              }

              this.updatedFavorites++;
              this.updateComplete(tmp.length, refresher);
            }, error => {
              this.allFavorites.push(tmp[i]);
              this.updatedFavorites++;
              console.log(error);
              this.updateComplete(tmp.length, refresher);
            });
          }, error => {
            this.allFavorites.push(tmp[i]);
            this.updatedFavorites++;
            console.log(error);
            this.updateComplete(tmp.length, refresher);
          });
        } else {
          this.allFavorites.push(tmp[i]);
          this.updatedFavorites++;
          this.updateComplete(tmp.length, refresher);
          console.log('[Library]: No identifier or title found.');
        }
      }
    } else {
      this.isLoadedFavorites = true;
      if (refresher) {
        refresher.target.complete();
      }
    }
  }

  sortFavorites(favoritesArray) {
    favoritesArray = utils.convertToArray(favoritesArray);
    return favoritesArray.sort((fav1, fav2) => {
      let wholeTitle = '';
      let wholeTitle2 = '';
      if (fav1 && fav1.titleInfo) {
        const titleInfo = utils.convertToArray(fav1.titleInfo)[0];

        if (titleInfo.title) {
          wholeTitle = titleInfo.title;
        }

        if (titleInfo.subTitle) {
          wholeTitle = wholeTitle + ' ' + titleInfo.subTitle;
        }
      }

      if (fav2 && fav2.titleInfo) {
        const titleInfo = utils.convertToArray(fav2.titleInfo)[0];

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
      buttons: [
        {
          text: this.translate.instant('button.no'),
        },
        {
          text: this.translate.instant('button.yes'),
          handler: () => {
            this.displayedFavorites = [];
            this.allFavorites = [];
            this.storage.set('favoriteBooks', this.allFavorites);
          }
        }
      ]
    });
    alert.present();
  }

}
