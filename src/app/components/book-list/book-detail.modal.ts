import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { HttpHeaders, HttpParams, HttpClient } from '@angular/common/http';
import { CacheService } from 'ionic-cache';
import * as moment from 'moment';
import { ConfigService } from 'src/app/services/config/config.service';
import { WebIntentService } from 'src/app/services/web-intent/web-intent.service';
import { IConfig } from 'src/app/lib/interfaces';
import { WebHttpUrlEncodingCodec, utils } from 'src/app/lib/util';
import { TranslateService } from '@ngx-translate/core';
import { AlertService } from 'src/app/services/alert/alert.service';

@Component({
  selector: 'book-modal-page',
  templateUrl: './book-detail.modal.html',
  styleUrls: ['../../pages/library-search/library-search.page.scss'],
})
export class BookDetailModalPage implements OnInit {

  activeSegment = 'location';
  config: IConfig;
  showLocation = true;
  showDetails = false;
  showShortAbstract = true;
  showFullTOC = false;
  isLoaded = false;

  @Input() book;
  @Input() isFavorite;
  bookLocationList = [];
  shortAbstract = false;
  bookDetails = {
    'url': null,
    'keywords': [],
    'isbn': [],
    'series': [],
    'extent': [],
    'notes': [],
    'toc': [],
    'abstract': '',
    'shortAbstract': null,
    'mediaType': null,
    'noDetails': true
  };

  constructor(
      private modalCtrl: ModalController,
      private cache: CacheService,
      private http: HttpClient,
      private translate: TranslateService,
      private alert: AlertService,
      public webIntent: WebIntentService // is used in the HTML
    ) {
  }

  ngOnInit() {
    this.config = ConfigService.config;
    this.updateLocation();
    this.updateDetails();
  }

  closeModal() {
    this.modalCtrl.dismiss({
      'isFavoriteNew': this.isFavorite
    });
  }

  favorite() {
    this.isFavorite = !this.isFavorite;

    if (!this.isFavorite) {
      this.alert.presentToast(this.translate.instant('hints.text.favRemoved'));
    } else {
      this.alert.presentToast(this.translate.instant('hints.text.favAdded'));
    }
  }

  /**
   * @name updateDetails
   * @description updates the details of the requested book
   */
  updateDetails(): void {
    this.getKeywords();
    this.getISBN();
    this.getSeries();
    this.getExtent();
    this.getNotes();
    this.getAbstractAndTOC();
  }

  /**
   * @name updateLocation
   * @param refresher
   */
  updateLocation(refresher?): void {
    if (refresher) {
      this.cache.removeItem('bookLocation' + this.book.recordInfo.recordIdentifier._);
    } else { this.isLoaded = false; }

    const url = this.config.webservices.endpoint.libraryDAIA;

    const headers = new HttpHeaders()
        .append('Authorization', this.config.webservices.apiToken);

    const params = new HttpParams({encoder: new WebHttpUrlEncodingCodec()})
      .append('id', 'ppn:' + this.book.recordInfo.recordIdentifier._)
      .append('format', 'json');

    const request = this.http.get(url, {headers: headers, params: params});
    this.cache.loadFromObservable('bookLocation' + this.book.recordInfo.recordIdentifier._, request).subscribe(data => {
      if (refresher) {
        refresher.target.complete();
      }
      this.setLocationData(data);
      this.isLoaded = true;
    }, error => {
      console.log(error);
      this.isLoaded = true;
      if (refresher) {
        refresher.target.complete();
      }
    });
  }

  /**
   * @name setLocationData
   * @param data
   */
  setLocationData(data) {
    // console.log(data);
    this.bookLocationList = [];
    if (data && data.document) {
      let i, j;
      data.document = utils.convertToArray(data.document);
      for (i = 0; i < data.document.length; i++) {
        if (data.document[i].item) {
          data.document[i].item = utils.convertToArray(data.document[i].item);
          for (j = 0; j < data.document[i].item.length; j ++) {
            const locationModel = {
              department:     this.getDepartment(data.document[i].item[j]),
              departmentURL:  this.getDepartmentURL(data.document[i].item[j]),
              label:          this.getLabel(data.document[i].item[j]),
              item:           this.getItem(data.document[i].item[j]),
              url:            this.getBookUrl(data.document[i].item[j])
            };
            this.bookLocationList.push(locationModel);
          }
        }
      }
    }
    // console.log(this.bookLocationList);
  }

  /**
   * @name getDepartment
   * @param item
   */
  getDepartment(item) {
    let department = '';
    if (item.department && item.department.content) {
      department = item.department.content;
    }
    if (item.storage) {
      department = department + ', ' + item.storage.content;
    }
    return department;
  }

  /**
   * @name getDepartmentURL
   * @param item
   */
  getDepartmentURL(item) {
    if (item.department && item.department.id) {
      return item.department.id;
    } else { return ''; }
  }

  /**
   * @name getLabel
   * @param item
   */
  getLabel(item) {
    if (item.label) {
      return item.label;
    } else { return ''; }
  }

  /**
   * @name getBookUrl
   * @param item
   */
  getBookUrl(item): void {
    if (this.book.location) {
      let i;
      const tmp = utils.convertToArray(this.book.location);
      for (i = 0; i < tmp.length; i++) {
        if (tmp[i].url) {
          const tmpUrl = utils.convertToArray(tmp[i].url);
          let j;
          for (j = 0; j < tmpUrl.length; j++) {
            if (tmpUrl[j].$ && (tmpUrl[j].$.usage === 'primary display')) {
              if (tmpUrl[j]._) {
                this.bookDetails.url = tmpUrl[j]._;
              }
            }
          }
        }
      }
    }

    if (this.bookDetails.mediaType === 'mediatype_o') {
      let url;
      if (item.unavailable && item.unavailable[0].service === 'openaccess') {
        url = item.unavailable[0].href;
      } else { url = null; }
      if (url != null) { this.bookDetails.url = url; }
    }

    return this.bookDetails.url;
  }

  /**
   * @name getItem
   * @param item
   */
  getItem(item) {
    let status = '', statusInfo = '';

    // check for available / unavailable items and process loan and presentation
    let loanAvailable, presentationAvailable;
    if (item.available) {
      // tslint:disable-next-line:no-var-keyword
      const availableArray = utils.convertToArray(item.available);
      loanAvailable = availableArray.find(x => x.service === 'loan');
      presentationAvailable = availableArray.find(x => x.service === 'presentation');
    }

    let loanUnavailable, presentationUnavailable;
    if (item.unavailable) {
      const unavailableArray = utils.convertToArray(item.unavailable);
      loanUnavailable = unavailableArray.find(x => x.service === 'loan');
      presentationUnavailable = unavailableArray.find(x => x.service === 'presentation');
    }

    if (loanAvailable) {
      status = 'ausleihbar';

      if (presentationAvailable) {
        // tag available with service="loan" and href=""?
        if (presentationAvailable.limitation) {
          statusInfo = presentationAvailable.limitation[0].content;
        }

        if (loanAvailable.href === '') {
          statusInfo = statusInfo + 'Bitte bestellen';
        }
      }
    } else {
      // check for loan in unavailable items
      // indicates LBS and Online-Resources
      if (loanUnavailable && loanUnavailable.href) {
        if (loanUnavailable.href.indexOf('loan/RES') !== -1) {
          status = 'ausleihbar';
        } else { status = 'nicht ausleihbar'; }
      } else {
        // if there is no url then it will be a presentation
        if (this.getBookUrl(item) == null) {
          if (item.label && item.label.indexOf('bestellt') !== -1) {
            status = item.label;
            statusInfo = '';
          } else {
            status = 'Präsenzbestand';
            if (presentationAvailable.limitation) {
              statusInfo = presentationAvailable.limitation[0].content;
            }
          }
        } else {
          status = 'Online-Ressource im Browser öffnen';
        }
      }

      if (presentationUnavailable) {
        if (loanUnavailable && loanUnavailable.href) {
          if (loanUnavailable.href.indexOf('loan/RES') !== -1) {
            status = 'ausgeliehen';
            if (!loanUnavailable.expected || loanUnavailable.expected === 'unknown') {
              statusInfo = statusInfo + 'ausgeliehen, Vormerken möglich';
            } else {
              statusInfo = statusInfo + 'ausgeliehen bis ';
              statusInfo = statusInfo + moment(loanUnavailable.expected, 'YYYY-MM-DD').format('DD.MM.YYYY');
              statusInfo = statusInfo + ', vormerken möglich';
            }
          }
        } else {
          statusInfo = statusInfo + '...';
        }
      }
    }

    return [status, statusInfo];
  }

  /**
   * @name getKeywords
   */
  getKeywords(): void {
    if (this.book.subject) {
      const tmp = utils.convertToArray(this.book.subject);
      let i;
      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i].topic) {
          if (!utils.isInArray(this.bookDetails.keywords, tmp[i].topic)) {
            this.bookDetails.keywords.push(tmp[i].topic);
            this.bookDetails.noDetails = false;
          }
        } else if (tmp[i] && tmp[i].geographic) {
          if (!utils.isInArray(this.bookDetails.keywords, tmp[i].geographic)) {
            this.bookDetails.keywords.push(tmp[i].geographic);
            this.bookDetails.noDetails = false;
          }
        } else if (tmp[i] && tmp[i].$ && tmp[i].$.displayLabel) {
          if (!utils.isInArray(this.bookDetails.keywords, tmp[i].$.displayLabel)) {
            this.bookDetails.keywords.push(tmp[i].$.displayLabel);
            this.bookDetails.noDetails = false;
          }
        }
      }
    }
  }

  /**
   * @name getISBN
   */
  getISBN(): void {
    if (this.book.identifier) {
      const tmp = utils.convertToArray(this.book.identifier);
      let i;
      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i]._) {
          if (!utils.isInArray(this.bookDetails.isbn, tmp[i]._)) {
            let identString;
            if (tmp[i].$ && tmp[i].$.type) {
              identString = tmp[i]._ + ' [' + tmp[i].$.type + ']';
            } else { identString = tmp[i]._; }

            this.bookDetails.isbn.push(identString);
            this.bookDetails.noDetails = false;
          }
        }
      }
    }
  }

  /**
   * @name getSeries
   */
  getSeries(): void {
    let i;
    if (this.book.titleInfo) {
      const tmp = utils.convertToArray(this.book.titleInfo);

      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i].partNumber && !utils.isInArray(this.bookDetails.series, tmp[i].partNumber)) {
          this.bookDetails.series.push(tmp[i].partNumber);
          this.bookDetails.noDetails = false;
        }
      }
    }
    if (this.book.relatedItem) {
      const tmp = utils.convertToArray(this.book.relatedItem);

      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i].$ && tmp[i].$.type === 'series') {
          if (tmp[i].titleInfo && tmp[i].titleInfo.title && !utils.isInArray(this.bookDetails.series, tmp[i].titleInfo.title)) {
            this.bookDetails.series.push(tmp[i].titleInfo.title);
            this.bookDetails.noDetails = false;
          }
        }
      }
    }
  }

  /**
   * @name getExtent
   */
  getExtent(): void {
    let i;
    if (this.book.physicalDescription) {
      const tmp = utils.convertToArray(this.book.physicalDescription);

      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i].extent && !utils.isInArray(this.bookDetails.extent, tmp[i].extent)) {
          this.bookDetails.extent.push(tmp[i].extent);
          this.bookDetails.noDetails = false;
        }
      }
    }
  }

  /**
   * @name getNotes
   */
  getNotes(): void {
    let i;
    if (this.book.note) {
      const tmp = utils.convertToArray(this.book.note);

      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i]._ && !utils.isInArray(this.bookDetails.notes, tmp[i]._)) {
          this.bookDetails.notes.push(tmp[i]._);
          this.bookDetails.noDetails = false;
        } else if (typeof tmp[i] === 'string' && !utils.isInArray(this.bookDetails.notes, tmp[i])) {
          this.bookDetails.notes.push(tmp[i]);
          this.bookDetails.noDetails = false;
        }
      }
    }

    if (this.book.relatedItem && this.book.relatedItem.note) {
      const tmp = utils.convertToArray(this.book.relatedItem.note);
      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i]._ && !utils.isInArray(this.bookDetails.notes, tmp[i]._)) {
          this.bookDetails.notes.push(tmp[i]._);
          this.bookDetails.noDetails = false;
        } else if (typeof tmp[i] === 'string' && !utils.isInArray(this.bookDetails.notes, tmp[i])) {
          this.bookDetails.notes.push(tmp[i]);
          this.bookDetails.noDetails = false;
        }
      }
    }
  }

  /**
   * @name getAbstractAndTOC
   */
  getAbstractAndTOC(): void {
    let i, j;
    if (this.book.abstract) {
      const tmp = utils.convertToArray(this.book.abstract);

      for (i = 0; i < tmp.length; i++) {
        if (tmp[i] && tmp[i].indexOf('--') >= 0) {
          const toc = tmp[i].split('--');
          for (j = 0; j < toc.length; j++) {
            if (toc[j] !== '') {
              this.bookDetails.toc.push(toc[j]);
              this.bookDetails.noDetails = false;
            }
          }
        } else {
          this.bookDetails.abstract += tmp[i];
          this.bookDetails.noDetails = false;
        }
      }
    }

    if (this.bookDetails.abstract.length > 280) {
      this.bookDetails.shortAbstract = this.bookDetails.abstract.substring(0, 279) + '...';
      this.shortAbstract = true;
    }
  }

  /**
   * @name setMediaType
   * @param mediatype
   */
  setMediaType(mediatype): void {
    this.bookDetails.mediaType = mediatype;
  }

}
