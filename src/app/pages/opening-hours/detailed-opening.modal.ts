import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { WebIntentService } from 'src/app/services/web-intent/web-intent.service';
import { Logger, LoggingService } from 'ionic-logging-service';
import { contains } from 'src/app/lib/util';

@Component({
  selector: 'detailed-opening-modal-page',
  templateUrl: './detailed-opening.modal.html',
})
export class DetailedOpeningModalPage implements OnInit {
  @Input() item;
  intervals = [];
  itv = [];
  every_week_is_same;
  comment;
  logger: Logger;

  constructor(
    private modalCtrl: ModalController,
    public translate: TranslateService,
    private webIntent: WebIntentService,
    private loggingService: LoggingService
  ) {
    this.logger = this.loggingService.getLogger('[/detailed-opening-modal]');
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
  callContact(num: string) {
    window.location.href = 'tel:' + num;
  }

  shortenLink(link: string) {
    if (link.length > 30) {
      return link.substr(0, 30) + '...';
    } else {
      return link;
    }
  }

  openUntil() {
    const willClose: Date = this.item.nextChange;

    if (willClose) {
      if (this.isToday(willClose)) {
        return (
          this.translate.instant('page.opening-hours.closes') +
          willClose.toLocaleTimeString(this.translate.currentLang, {
            hour: 'numeric',
            minute: 'numeric',
          }) +
          this.translate.instant('page.opening-hours.time')
        );
      } else {
        return (
          this.translate.instant('page.opening-hours.closes') +
          this.weekday(willClose.getDay()) +
          ' ' +
          willClose.toLocaleTimeString(this.translate.currentLang, {
            hour: 'numeric',
            minute: 'numeric',
          }) +
          this.translate.instant('page.opening-hours.time')
        );
      }
    } else {
      return '';
    }
  }

  closedUntil() {
    const willChange: Date = this.item.nextChange;

    if (willChange) {
      if (this.isToday(willChange)) {
        return (
          this.translate.instant('page.opening-hours.opens') +
          willChange.toLocaleTimeString(this.translate.currentLang, {
            hour: 'numeric',
            minute: 'numeric',
          }) +
          this.translate.instant('page.opening-hours.time')
        );
      } else {
        return (
          this.translate.instant('page.opening-hours.opens') +
          this.weekday(willChange.getDay()) +
          ' ' +
          willChange.toLocaleTimeString(this.translate.currentLang, {
            hour: 'numeric',
            minute: 'numeric',
          }) +
          this.translate.instant('page.opening-hours.time')
        );
      }
    } else {
      if (this.comment != null) {
        if (
          this.translate.currentLang === 'en' &&
          contains(this.comment, 'nach Vereinbarung')
        ) {
          this.comment = 'nach Vereinbarung';
          return 'by appointment only';
        } else if (contains(this.comment, 'nach Vereinbarung')) {
          this.comment = 'nach Vereinbarung';
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
    return (
      td.getDate() === d.getDate() &&
      td.getMonth() === d.getMonth() &&
      td.getFullYear() === d.getFullYear()
    );
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

    this.itv = [];
    for (const interval of this.intervals) {
      const dayLocaleString =
        this.weekday(interval[0].getDay()) +
        ', ' +
        interval[0].toLocaleDateString(this.translate.currentLang);
      const openInterval = this.parseDate(interval[0], interval[1]);

      let found;
      for (let i = 0; i < this.itv.length; i++) {
        if (Array.isArray(this.itv[i])) {
          if (this.itv[i][0] === dayLocaleString) {
            found = i;
            break;
          }
        }
      }

      if (found !== undefined) {
        this.itv[found].push(openInterval);
      } else {
        const lgth = this.itv.length;
        this.itv[lgth] = [];
        this.itv[lgth][0] = dayLocaleString;
        this.itv[lgth].push(openInterval);
      }
    }

    this.every_week_is_same = this.item.parsedOpening.isWeekStable();
  }

  parseDate(from: Date, to: Date) {
    return (
      from.toLocaleTimeString(this.translate.currentLang, {
        hour: 'numeric',
        minute: 'numeric',
      }) +
      this.translate.instant('page.opening-hours.time') +
      ' - ' +
      to.toLocaleTimeString(this.translate.currentLang, {
        hour: 'numeric',
        minute: 'numeric',
      }) +
      this.translate.instant('page.opening-hours.time')
    );
  }
}
