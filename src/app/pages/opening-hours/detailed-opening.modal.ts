import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { WebIntentService } from 'src/app/services/web-intent/web-intent.service';
import { CallNumber } from '@ionic-native/call-number/ngx';

@Component({
  selector: 'detailed-opening-modal-page',
  templateUrl: './detailed-opening.modal.html',
})
export class DetailedOpeningModalPage implements OnInit {

  @Input() item;
  intervals = [];
  every_week_is_same;
  comment;

  constructor(
      private modalCtrl: ModalController,
      private translate: TranslateService,
      private webIntent: WebIntentService,
      private callNumber: CallNumber
    ) {
  }

  ngOnInit() {
    this.comment = this.item.parsedOpening.getComment();
    this.getOpenTimes();
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  openURL(url) {
    this.webIntent.permissionPromptWebsite(url);
  }

  /**
   * @name callContact
   * @description using native call for calling numbers
   * @param {string} number
   * https://www.javascripttuts.com/making-phone-calls-to-contacts-with-ionic-in-one-go/
   */
  callContact(number: string) {
    this.callNumber.callNumber(number, true)
      .then(() => console.log('Dialer Launched!'))
      .catch(() => console.log('Error launching dialer'));
  }

  shortenLink(link: string) {
    if (link.length > 30) {
      return link.substr(0, 30) + '...';
    } else { return link; }
  }

  openUntil() {
    const willClose: Date = this.item.nextChange;

    if (willClose) {
      if (this.isToday(willClose)) {
        return this.translate.instant('page.opening-hours.closes')
        + this.addZero(willClose.getHours()) + ':'
        + this.addZero(willClose.getMinutes())
        + this.translate.instant('page.opening-hours.time');
      } else {
        return this.translate.instant('page.opening-hours.closes')
        + this.weekday(willClose.getDay()) + ' '
        + this.addZero(willClose.getHours()) + ':'
        + this.addZero(willClose.getMinutes())
        + this.translate.instant('page.opening-hours.time');
      }
    } else {
      return '';
    }
  }

  closedUntil() {
    const willChange: Date = this.item.nextChange;

    if (willChange) {
      if (this.isToday(willChange)) {
        return this.translate.instant('page.opening-hours.opens')
        + this.addZero(willChange.getHours()) + ':'
        + this.addZero(willChange.getMinutes())
        + this.translate.instant('page.opening-hours.time');
      } else {
        return this.translate.instant('page.opening-hours.opens')
        + this.weekday(willChange.getDay()) + ' '
        + this.addZero(willChange.getHours()) + ':'
        + this.addZero(willChange.getMinutes())
        + this.translate.instant('page.opening-hours.time');
      }
    } else {
      if (this.comment != null) {
        if (this.translate.currentLang === 'en' && this.comment === 'nach Vereinbarung') {
          return 'by appointment only';
        } else if (this.comment === 'nach Vereinbarung') {
          return this.comment;
        } else {
          return '';
        }
      } else {
        return '';
      }
    }
  }

   isToday(td) {
    const d = new Date();
    return td.getDate() === d.getDate() && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
  }

  addZero(i) {
    if (i < 10) {
      i = '0' + i;
    }
    return i;
  }

  weekday(i) {
    const weekday = [];
    if (this.translate.currentLang === 'de') {
      weekday[0] = 'So.';
      weekday[1] = 'Mo.';
      weekday[2] = 'Di.';
      weekday[3] = 'Mi.';
      weekday[4] = 'Do.';
      weekday[5] = 'Fr.';
      weekday[6] = 'Sa.';
    } else {
      weekday[0] = 'Su.';
      weekday[1] = 'Mo.';
      weekday[2] = 'Tu.';
      weekday[3] = 'We.';
      weekday[4] = 'Th.';
      weekday[5] = 'Fr.';
      weekday[6] = 'Sa.';
    }
    return weekday[i];
  }

  getOpenTimes() {
    const from = new Date();
    const to = new Date();
    from.setHours(0, 0, 0, 0);
    to.setDate(to.getDate() + 6);
    to.setHours(23, 59, 59, 999);

    this.intervals = this.item.parsedOpening.getOpenIntervals(from, to);

    this.every_week_is_same = this.item.parsedOpening.isWeekStable();
  }

  parseDate(from: Date, to: Date) {
    return this.addZero(from.getHours()) + ':'
    + this.addZero(from.getMinutes())
    + this.translate.instant('page.opening-hours.time') + ' - '
    + this.addZero(to.getHours()) + ':'
    + this.addZero(to.getMinutes())
    + this.translate.instant('page.opening-hours.time');
  }

}
