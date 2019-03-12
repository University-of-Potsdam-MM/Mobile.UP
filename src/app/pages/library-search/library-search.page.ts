import { Component, OnInit } from '@angular/core';
import * as xml2js from 'xml2js';
import { Platform, ModalController, ToastController, IonItemSliding } from '@ionic/angular';
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
  bookList = [];
  displayedFavorites = [];
  allFavorites = [];
  numberOfRecords = '0';

  constructor(
    private connection: ConnectionService,
    private platform: Platform,
    private keyboard: Keyboard,
    private http: HttpClient,
    private modalCtrl: ModalController,
    private translate: TranslateService,
    private toastCtrl: ToastController,
    private storage: Storage
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

            if (this.numberOfRecords === '1') {
              tmpList = utils.convertToArray(tmpList);
            }

            if (tmp['zs:numberOfRecords']) {
              this.numberOfRecords = tmp['zs:numberOfRecords'];
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
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: BookDetailModalPage,
      componentProps: { book: book }
    });
    modal.present();
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
   * @name makeFavorite
   * @description set favorite and save to storage
   * @param {ADS} ads
   * @param {ItemSliding} slidingItem
   */
  makeFavorite(book, slidingItem: IonItemSliding) {
    if (!utils.isInArray(this.displayedFavorites, book)) {
      // reverse, so that newest favs are on top
      this.displayedFavorites = this.displayedFavorites.reverse();
      this.displayedFavorites.push(book);
      this.displayedFavorites = this.displayedFavorites.reverse();

      if (!utils.isInArray(this.allFavorites, book)) {
        this.allFavorites = this.allFavorites.reverse();
        this.allFavorites.push(book);
        this.allFavorites = this.allFavorites.reverse();
      }
      this.presentToast(this.translate.instant('hints.text.favAdded'));
    } else {
      this.presentToast(this.translate.instant('hints.text.favExists'));
    }

    this.storage.set('favoriteBooks', this.allFavorites);

    slidingItem.close();
  }

  /**
   * @name removeFavorite
   * @description removes favorites
   * @param {ADS} ads
   */
  removeFavorite(ads) {
    let i;
    const tmp = [];
    for (i = 0; i < this.allFavorites.length; i++) {
      if (this.allFavorites[i] !== ads) {
        tmp.push(this.allFavorites[i]);
      }
    }

    const tmp2 = [];
    for (i = 0; i < this.displayedFavorites.length; i++) {
      if (this.displayedFavorites[i] !== ads) {
        tmp2.push(this.displayedFavorites[i]);
      }
    }

    this.allFavorites = [];
    this.allFavorites = tmp;
    this.displayedFavorites = [];
    this.displayedFavorites = tmp2;
    this.presentToast(this.translate.instant('hints.text.favRemoved'));
    this.storage.set('favoriteBooks', this.allFavorites);
  }

  /**
   * @name checkFavorites
   * @async
   * @description TODO: checks if favorites are still valid
   */
  async checkFavorites() {
    const tmp = await this.storage.get('favoriteBooks');
    if (tmp) {
      this.displayedFavorites = tmp;
      this.allFavorites = tmp;
    }
  }

}
