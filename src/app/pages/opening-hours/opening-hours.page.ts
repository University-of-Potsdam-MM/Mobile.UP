import { Component, OnDestroy, OnInit } from '@angular/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { TranslateService } from '@ngx-translate/core';
import opening_hours, { nominatim_object, optional_conf } from 'opening_hours';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';

@Component({
  selector: 'app-opening-hours',
  templateUrl: './opening-hours.page.html',
  styleUrls: ['./opening-hours.page.scss'],
})
export class OpeningHoursPage
  extends AbstractPage
  implements OnInit, OnDestroy
{
  openingHours = [];
  allOpeningHours: any = [];
  weekday = [];
  isLoaded;
  query = '';
  networkError;

  constructor(
    private translate: TranslateService,
    private ws: WebserviceWrapperService
  ) {
    super({ optionalNetwork: true });
  }

  ngOnInit() {
    this.setupWeekdayMapping();
    this.loadOpeningHours();

    if (this.platform.is('ios')) {
      Keyboard.setResizeMode({ mode: KeyboardResize.None });
    }
  }

  ngOnDestroy() {
    if (this.platform.is('ios')) {
      Keyboard.setResizeMode({ mode: KeyboardResize.Ionic });
    }
  }

  loadOpeningHours(refresher?) {
    this.networkError = false;
    this.ws.call('nominatim').subscribe(
      (nominatim: nominatim_object) => {
        if (!(refresher && refresher.target)) {
          this.isLoaded = false;
        } else {
          this.query = '';
        }

        this.ws
          .call('openingHours', {}, { forceRefresh: refresher !== undefined })
          .subscribe(
            (response) => {
              this.allOpeningHours = response;

              const from = new Date();
              const to = new Date();
              to.setDate(to.getDate() + 6);
              to.setHours(23, 59, 59, 999);

              const optionalConfig: optional_conf = {
                mode: 0,
                locale: this.translate.currentLang,
                tag_key: undefined,
                map_value: undefined,
                warnings_severity: undefined,
              };

              for (const openingHour of this.allOpeningHours) {
                openingHour.parsedOpening = new opening_hours(
                  openingHour.opening_hours,
                  nominatim,
                  optionalConfig
                );

                openingHour.nextChange =
                  openingHour.parsedOpening.getNextChange(from, to);

                openingHour.state = openingHour.parsedOpening.getState();
                openingHour.unknownState =
                  openingHour.parsedOpening.getUnknown();

                openingHour.intervals =
                  openingHour.parsedOpening.getOpenIntervals(from, to);

                openingHour.itv = [];

                for (const interval of openingHour.intervals) {
                  const dayLocaleString =
                    this.weekday[interval[0].getDay()] +
                    ', ' +
                    interval[0].toLocaleDateString(this.translate.currentLang);
                  const openInterval = this.parseDate(interval[0], interval[1]);

                  let found;
                  for (let i = 0; i < openingHour.itv.length; i++) {
                    if (Array.isArray(openingHour.itv[i])) {
                      if (openingHour.itv[i][0] === dayLocaleString) {
                        found = i;
                        break;
                      }
                    }
                  }

                  if (found !== undefined) {
                    openingHour.itv[found].push(openInterval);
                  } else {
                    const lgth = openingHour.itv.length;
                    openingHour.itv[lgth] = [];
                    openingHour.itv[lgth][0] = dayLocaleString;
                    openingHour.itv[lgth].push(openInterval);
                  }
                }
              }

              this.openingHours = this.sortOpenings(this.allOpeningHours);
              this.isLoaded = true;

              if (refresher && refresher.target) {
                refresher.target.complete();
              }
            },
            () => {
              this.isLoaded = true;
              if (refresher && refresher.target) {
                refresher.target.complete();
              }
              this.networkError = true;
            }
          );
      },
      () => {
        if (refresher && refresher.target) {
          refresher.target.complete();
        }
        this.isLoaded = true;
        this.networkError = true;
      }
    );
  }

  sortOpenings(openArray): any[] {
    return openArray.sort((a, b) => {
      if (a.state !== b.state) {
        return a.state ? -1 : 1;
      } else {
        const changeA = a.nextChange;
        const changeB = b.nextChange;
        if (changeA === undefined) {
          // sort B before A, because state of A doesnt change in the next 6 days
          return 1;
        } else if (changeB === undefined) {
          // sort A before B, because state of B doesnt change in the next 6 days
          return -1;
        } else {
          // sort depending on whether state of A or B changes first
          return changeA - changeB;
        }
      }
    });
  }

  // hides keyboard once the user is scrolling
  onScrollListener() {
    if (this.platform.is('ios') || this.platform.is('android')) {
      Keyboard.hide();
    }
  }

  openUntil(index) {
    const willClose: Date = this.openingHours[index].nextChange;

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
          this.weekday[willClose.getDay()] +
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

  closedUntil(index) {
    const willChange: Date = this.openingHours[index].nextChange;

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
          this.weekday[willChange.getDay()] +
          ' ' +
          willChange.toLocaleTimeString(this.translate.currentLang, {
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

  getComment(index) {
    const comment = this.openingHours[index].parsedOpening.getComment();
    if (comment != null) {
      return comment;
    } else {
      return '';
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

  splitItemName(name) {
    name = name.replace(')', '');
    name = name.split('(');

    return name;
  }

  setupWeekdayMapping() {
    this.weekday = [];
    if (this.translate.currentLang === 'de') {
      this.weekday[0] = 'So.';
      this.weekday[1] = 'Mo.';
      this.weekday[2] = 'Di.';
      this.weekday[3] = 'Mi.';
      this.weekday[4] = 'Do.';
      this.weekday[5] = 'Fr.';
      this.weekday[6] = 'Sa.';
    } else {
      this.weekday[0] = 'Su.';
      this.weekday[1] = 'Mo.';
      this.weekday[2] = 'Tu.';
      this.weekday[3] = 'We.';
      this.weekday[4] = 'Th.';
      this.weekday[5] = 'Fr.';
      this.weekday[6] = 'Sa.';
    }
  }

  filterItems(event) {
    const val = event.target.value;
    this.openingHours = this.allOpeningHours;

    if (val && val.trim() !== '') {
      this.openingHours = this.openingHours.filter(function (item) {
        if (item && item.name) {
          return item.name.toLowerCase().includes(val.toLowerCase());
        } else {
          return false;
        }
      });
    }
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

  openURL($event, url) {
    $event.stopPropagation();
    this.webIntent.permissionPromptWebsite(url);
  }

  openMail($event, mail) {
    $event.stopPropagation();
    window.location.href = 'mailto:' + mail;
  }

  /**
   * @name callContact
   * @description using native call for calling numbers
   * @param {string} number
   */
  callContact($event, num: string) {
    $event.stopPropagation();
    window.location.href = 'tel:' + num;
  }
}
