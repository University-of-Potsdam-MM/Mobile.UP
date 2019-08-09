import { Component } from '@angular/core';
import { IEventObject, createEventSource } from './createEvents';
import { Platform, ModalController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { DomSanitizer } from '@angular/platform-browser';
import { EventModalPage } from './event.modal';
import { IPulsAPIResponse_getStudentCourses } from 'src/app/lib/interfaces_PULS';
import { Calendar } from '@ionic-native/calendar/ngx';
import { AlertService } from 'src/app/services/alert/alert.service';
import * as dLoop from 'delayed-loop';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.page.html',
  styleUrls: ['./timetable.page.scss'],
})
export class TimetablePage extends AbstractPage {

  // tslint:disable-next-line: max-line-length
  hexValues = ['#FFCC80', '#9FA8DA', '#A5D6A7', '#B0BEC5', '#ef9a9a', '#90CAF9', '#81D4FA', '#80DEEA', '#80CBC4', '#C5E1A5', '#B39DDB', '#E6EE9C', '#FFE082', '#FFAB91', '#BCAAA4', '#EEEEEE', '#F48FB1', '#CE93D8', '#FFF59D'];
  courseToHex: string[][] = [];
  hexIndex = 0;

  eventSource: IEventObject[] = [];
  noUserRights = false;
  isLoading = true;

  isMobile;
  exportFinished = true;
  exportedEvents = 0;
  modalOpen;

  // title string that should be displayed for every mode, eg. "24.12.2018"
  currentTitle = '';

  // options for ionic2-calendar component
  calendarOptions = {
    calendarMode: 'day',
    currentDate: new Date(),
    locale: 'de',
    startingDayWeek: 1,
    startingDayMonth: 1,
    startHour: '8',
    endHour: '20',
    step: '40',
    timeInterval: '120',
    showEventDetail: false,
    autoSelect: false,
    dateFormatter: undefined
  };

  constructor(
    private platform: Platform,
    private translate: TranslateService,
    private ws: WebserviceWrapperService,
    private sanitizer: DomSanitizer,
    private calendar: Calendar,
    private modalCtrl: ModalController,
    private alertService: AlertService,
    private alertCtrl: AlertController
  ) {
    super({ optionalNetwork: true, requireSession: true });
  }

  async ionViewWillEnter() {

    if (this.platform.is('android') || this.platform.is('ios')) { this.isMobile = true; }
    this.setupCalendarOptions();

    if (this.session) {
      this.isLoading = true;
      // there is a session
      this.ws.call(
        'pulsGetStudentCourses',
        {session: this.session}
      ).subscribe(
        (response: IPulsAPIResponse_getStudentCourses) => {
          if (response && response.message && response.message === 'no user rights') {
            this.noUserRights = true;
            this.isLoading = false;
          } else {
            this.noUserRights = false;
            this.isLoading = false;
            if (
              response
              && response.studentCourses
              && response.studentCourses.student
              && response.studentCourses.student.actualCourses
              && response.studentCourses.student.actualCourses.course
            ) {
              this.eventSource = createEventSource(
                response.studentCourses.student.actualCourses.course
              );
            }
          }
        }, () => { this.isLoading = false; }
      );
    } else {
      setTimeout(() => {
        this.ionViewWillEnter();
      }, 500);
    }
  }

  /* ~~~ ionic2-calendar specific methods ~~~ */

  setupCalendarOptions() {
    if (this.translate.currentLang === 'de') {
      this.calendarOptions.locale = 'de';
      const weekString = this.translate.instant('page.timetable.week');
      this.calendarOptions.dateFormatter = {
        formatWeekViewDayHeader: function(date: Date) {
          return moment(date).format('dd D');
        },
        formatDayViewHourColumn: function(date: Date) {
          return moment(date).format('HH:mm');
        },
        formatWeekViewHourColumn: function(date: Date) {
          return moment(date).format('HH:mm');
        },
        formatWeekViewTitle: function(date: Date) {
          return moment(date).format('MMMM YYYY') + ', ' + weekString + ' ' + moment(date).format('w');
      },
        formatMonthViewTitle: function(date: Date) {
          return moment(date).format('MMMM YYYY');
        },
        formatDayViewTitle: function(date: Date) {
          return moment(date).format('ddd, Do MMMM YYYY');
        }
      };
    } else {
      this.calendarOptions.locale = 'en';
      this.calendarOptions.dateFormatter = {
        formatWeekViewDayHeader: function(date: Date) {
          return moment(date).format('dd D');
        },
        formatDayViewHourColumn: function(date: Date) {
          return moment(date).format('hh A');
        },
        formatWeekViewHourColumn: function(date: Date) {
          return moment(date).format('hh A');
        },
        formatDayViewTitle: function(date: Date) {
          return moment(date).format('ddd, MMMM Do YYYY');
        }
      };
    }
  }

  /**
   * simply changes the calendarMode
   * @param mode
   */
  changeCalendarMode(mode) {
    this.calendarOptions.calendarMode = mode;
    if (this.translate.currentLang === 'de') {
      this.calendarOptions.locale = 'de';
    } else { this.calendarOptions.locale = 'en'; }
  }

  /**
   * triggered when event is selected in any other view than monthView. Then
   * a modal with information about the event is shown.
   * @param event
   */
  async eventSelected(event: IEventObject) {
    if (this.calendarOptions.calendarMode !== 'month') {
      const eventModal = await this.modalCtrl.create({
        backdropDismiss: false,
        component: EventModalPage,
        componentProps: { events: [event], date: event.startTime }
      });
      eventModal.present();
      this.modalOpen = true;
      await eventModal.onDidDismiss();
      this.modalOpen = false;
    }
  }

  /**
   * triggred when a time is clicked. Here a modal is shown when a time is
   * clicked in monthView and there are events at this timeslot.
   * @param time
   */
  timeSelected(time) {
    if (this.calendarOptions.calendarMode === 'month' && time && time.events && time.events.length > 0) {
      this.calendarOptions.calendarMode = 'day';
    }
  }

  /**
   * simply changes the current views title when month/week/day is changed
   * @param title
   */
  titleChanged(title) {
    this.currentTitle = title;
  }

  swipePrevious() {
    const mySwiper = document.querySelector('.swiper-container')['swiper'];
    mySwiper.slidePrev();
  }

  swipeNext() {
    const mySwiper = document.querySelector('.swiper-container')['swiper'];
    mySwiper.slideNext();
  }

  getColor(event) {
    if (event && event.event && event.event.courseDetails && event.event.courseDetails.courseId) {
      const eventColor = this.courseIdToHexColor(event.event.courseDetails.courseId);
      return this.sanitizer.bypassSecurityTrustStyle('background-color: ' + eventColor + '!important;');
    } else { return this.sanitizer.bypassSecurityTrustStyle(''); }
  }

  /**
   * @name courseIdToHexColor
   * @description converts course id to hex string
   * @param d {number} decimal number
   * @returns {string} 3 byte hex color string
   */
  courseIdToHexColor(d) {
    const padding = 6;
    let hex = Number(d).toString(16);
    while (hex.length < padding) {
      hex = '0' + hex;
    }

    if (this.hexIndex < this.hexValues.length) {
      let i;
      let found = false;
      for (i = 0; i < this.courseToHex.length; i++) {
        if (this.courseToHex[i] && this.courseToHex[i][0] && this.courseToHex[i][0] === hex) {
          found = true;
          return this.courseToHex[i][1];
        }
      }

      if (!found) {
        this.courseToHex[this.hexIndex] = [];
        this.courseToHex[this.hexIndex][0] = hex;
        this.courseToHex[this.hexIndex][1] = this.hexValues[this.hexIndex];
        this.hexIndex = this.hexIndex + 1;
        return this.courseToHex[this.hexIndex - 1][1];
      }

    } else {
      return `#${hex}`;
    }
  }

  async exportPrompt() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('alert.title.exportCalendar'),
      message: this.translate.instant('alert.exportCalendar'),
      buttons: [
        {
          text: this.translate.instant('button.no'),
        },
        {
          text: this.translate.instant('button.yes'),
          handler: async () => {
            const existingCalendars = await this.calendar.listCalendars();
            let found = false;
            if (Array.isArray(existingCalendars)) {
              for (let i = 0; i < existingCalendars.length; i++) {
                if (existingCalendars[i].name === this.translate.instant('placeholder.calendarName')) {
                  found = true;
                  break;
                }
              }
            }
            if (found) {
              const alert2 = await this.alertCtrl.create({
                header: this.translate.instant('hints.type.hint'),
                message: this.translate.instant('alert.calendar-exists'),
                buttons: [
                  {
                    text: this.translate.instant('button.keep'),
                    handler: () => {
                      this.exportCalendar();
                    }
                  },
                  {
                    text: this.translate.instant('button.delete'),
                    handler: () => {
                      this.calendar.deleteCalendar(this.translate.instant('placeholder.calendarName')).then(() => {
                        this.logger.debug('exportPrompt', 'deleted calendar');
                        this.exportCalendar();
                      }, error => {
                        this.alertService.showToast('alert.calendar-export-fail');
                        this.logger.error('exportPrompt', 'calendar deletion', error);
                      });
                    }
                  }
                ]
              });
              alert2.present();
            } else { this.exportCalendar(); }
          }
        }
      ]
    });
    alert.present();
  }

  exportCalendar() {
    this.calendar.hasReadWritePermission().then(result => {
      if (result) {
        this.logger.debug('exportCalendar', 'calendar access given');
        const createCalendarOpts = this.calendar.getCreateCalendarOptions();
        createCalendarOpts.calendarName = this.translate.instant('placeholder.calendarName');
        createCalendarOpts.calendarColor = '#ff9900';
        this.calendar.createCalendar(createCalendarOpts).then(async () => {

          let calID;
          const existingCalendars = await this.calendar.listCalendars();
          if (Array.isArray(existingCalendars)) {
            for (let i = 0; i < existingCalendars.length; i++) {
              if (existingCalendars[i].name === this.translate.instant('placeholder.calendarName')) {
                calID = existingCalendars[i].id;
                break;
              }
            }
          }

          this.exportFinished = false;
          this.exportedEvents = 0;

          if (Array.isArray(this.eventSource) && this.eventSource.length > 0) {
            const loop = dLoop(this.eventSource, (itm: IEventObject, idx, fin) => {
              if (itm.title && itm.startTime && itm.endTime) {
                const title = itm.title;
                const startDate = itm.startTime;
                const endDate = itm.endTime;

                let eventLocation = '';
                if (itm.eventDetails) {
                  if (itm.eventDetails.location) {
                    eventLocation += itm.eventDetails.location;
                  }

                  if (itm.eventDetails.building && itm.eventDetails.building !== 'N') {
                    if (eventLocation !== '') {
                      eventLocation += ': ';
                    }

                    eventLocation += itm.eventDetails.building;

                    if (itm.eventDetails.room && itm.eventDetails.room !== 'N.') {
                      eventLocation += '.' + itm.eventDetails.room;
                    }
                  }
                }

                let notes = '';
                if (itm.courseDetails && itm.courseDetails.courseType) {
                  notes += itm.courseDetails.courseType;
                }

                const calOptions = this.calendar.getCalendarOptions();
                calOptions.calendarId = calID;
                calOptions.calendarName = createCalendarOpts.calendarName;
                calOptions.firstReminderMinutes = null;

                this.calendar.createEventWithOptions(title, eventLocation, notes, startDate, endDate, calOptions).then(() => {
                  this.logger.debug('exportCalendar', 'exported event');
                  this.exportedEvents++;
                  fin();
                }, error => {
                  this.logger.error('exportCalendar', 'event creation', error);
                  this.exportedEvents++;
                  this.alertService.showToast('alert.calendar-event-fail');
                  fin();
                });
              }
            });

            loop.then(() => {
              this.exportFinished = true;
              this.alertService.showToast('alert.calendar-export-success');
            });
          } else {
            this.exportFinished = true;
          }
        }, error => {
          this.logger.error('exportCalendar', 'calendar creation', error);
          this.alertService.showToast('alert.calendar-export-fail');
        });
      } else {
        this.logger.error('exportCalendar', 'calendar access denied');
        this.alertService.showToast('alert.permission-denied');
      }
    }, error => {
      this.logger.error('exportCalendar', 'cant check permissions', error);
      this.alertService.showToast('alert.calendar-export-fail');
    });
  }

}
