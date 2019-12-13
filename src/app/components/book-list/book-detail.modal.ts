import { Component, OnInit, Input } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { AlertService } from '../../services/alert/alert.service';
import { IConfig } from '../../lib/interfaces';
import { WebIntentService } from '../../services/web-intent/web-intent.service';
import { ConfigService } from '../../services/config/config.service';
import { utils } from '../../lib/util';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';

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
  locationData;
  error;

  @Input() book;
  @Input() isFavorite;
  shortAbstract = false;
  bookDetails = {
    'title': '',
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
      private alertService: AlertService,
      public webIntent: WebIntentService,
      public platform: Platform,
      private ws: WebserviceWrapperService
    ) { }

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
      this.alertService.showToast('hints.text.favRemoved');
    } else {
      this.alertService.showToast('hints.text.favAdded');
    }
  }

  /**
   * @name updateDetails
   * @description updates the details of the requested book
   */
  updateDetails(): void {
    this.getTitle();
    this.getKeywords();
    this.getISBN();
    this.getSeries();
    this.getExtent();
    this.getNotes();
    this.getAbstractAndTOC();
  }

  getTitle() {
    if (this.book && this.book.titleInfo) {
      this.bookDetails.title = utils.convertToArray(this.book.titleInfo)[0].title;
      this.bookDetails.title = this.bookDetails.title.replace(new RegExp('-', 'g'), ' ');
    }
  }

  /**
   * @name updateLocation
   * @param refresher
   */
  updateLocation(refresher?): void {
    if (!(refresher && refresher.target)) {
      this.isLoaded = false;
    }

    this.ws.call(
      'libraryDAIA',
      {
        id: 'ppn:' + this.book.recordInfo.recordIdentifier._
      },
      { forceRefresh: refresher !== undefined }
    ).subscribe(data => {
      this.error = undefined;
      if (refresher && refresher.target) { refresher.target.complete(); }
      if (data) { this.locationData = data; }
      this.isLoaded = true;
    }, (error) => {
      this.error = error;
      this.isLoaded = true;
      if (refresher && refresher.target) { refresher.target.complete(); }
    });
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
        let tocToSplit = tmp[i];
        if (tocToSplit && tocToSplit._) { tocToSplit = tocToSplit._; }

        if (tocToSplit && tocToSplit.indexOf('--') >= 0) {
          const toc = tocToSplit.split('--');
          for (j = 0; j < toc.length; j++) {
            if (toc[j] !== '') {
              this.bookDetails.toc.push(toc[j]);
              this.bookDetails.noDetails = false;
            }
          }
        } else if (tocToSplit) {
          this.bookDetails.abstract += tocToSplit;
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
