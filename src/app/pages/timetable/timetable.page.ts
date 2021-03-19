/* eslint-disable @typescript-eslint/dot-notation */
import { Component } from '@angular/core';
import { IEventObject, createEventSource } from './createEvents';
import { ModalController, AlertController } from '@ionic/angular';
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
import { convertToArray } from 'src/app/lib/util';
import { IEvent, CalendarMode } from 'ionic2-calendar/calendar';

@Component({
  selector: 'app-timetable',
  templateUrl: './timetable.page.html',
  styleUrls: ['./timetable.page.scss'],
})
export class TimetablePage extends AbstractPage {
  hexValues = [
    '#FFCC80',
    '#9FA8DA',
    '#A5D6A7',
    '#B0BEC5',
    '#ef9a9a',
    '#90CAF9',
    '#81D4FA',
    '#80DEEA',
    '#80CBC4',
    '#C5E1A5',
    '#B39DDB',
    '#E6EE9C',
    '#FFE082',
    '#FFAB91',
    '#BCAAA4',
    '#EEEEEE',
    '#F48FB1',
    '#CE93D8',
    '#FFF59D',
  ];
  courseToHex: string[][] = [];
  hexIndex = 0;

  eventSource: IEvent[] = [];
  noUserRights = false;
  isLoading = true;

  isMobile;
  exportFinished = true;
  exportedEvents = 0;
  modalOpen;
  error;

  // title string that should be displayed for every mode, eg. "24.12.2018"
  currentTitle = '';

  calMode: CalendarMode = 'day';

  // options for ionic2-calendar component
  calendarOptions = {
    currentDate: new Date(),
    locale: 'de',
    startingDayWeek: 1,
    startingDayMonth: 1,
    startHour: 8,
    endHour: 20,
    step: 40,
    timeInterval: 120,
    showEventDetail: false,
    autoSelect: false,
    dateFormatter: undefined,
  };

  constructor(
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
    if (this.platform.is('android') || this.platform.is('ios')) {
      this.isMobile = true;
    }
    this.setupCalendarOptions();

    if (this.session) {
      this.isLoading = true;
      // there is a session
      this.ws
        .call('pulsGetStudentCourses', { session: this.session })
        .subscribe(
          (response: IPulsAPIResponse_getStudentCourses) => {
            this.error = undefined;
            if (
              response &&
              response.message &&
              response.message === 'no user rights'
            ) {
              this.noUserRights = true;
              this.isLoading = false;
            } else {
              this.noUserRights = false;
              this.isLoading = false;
              if (
                response &&
                response.studentCourses &&
                response.studentCourses.student &&
                response.studentCourses.student.actualCourses &&
                response.studentCourses.student.actualCourses.course
              ) {
                this.eventSource = createEventSource(
                  response.studentCourses.student.actualCourses.course
                );
              }
            }
          },
          (error) => {
            this.isLoading = false;
            this.error = error;
          }
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
        formatWeekViewDayHeader(date: Date) {
          return moment(date).format('dd D');
        },
        formatDayViewHourColumn(date: Date) {
          return moment(date).format('HH:mm');
        },
        formatWeekViewHourColumn(date: Date) {
          return moment(date).format('HH:mm');
        },
        formatWeekViewTitle(date: Date) {
          return (
            moment(date).format('MMMM YYYY') +
            ', ' +
            weekString +
            ' ' +
            moment(date).format('w')
          );
        },
        formatMonthViewTitle(date: Date) {
          return moment(date).format('MMMM YYYY');
        },
        formatDayViewTitle(date: Date) {
          return moment(date).format('ddd, Do MMMM YYYY');
        },
      };
    } else {
      this.calendarOptions.locale = 'en';
      this.calendarOptions.dateFormatter = {
        formatWeekViewDayHeader(date: Date) {
          return moment(date).format('dd D');
        },
        formatDayViewHourColumn(date: Date) {
          return moment(date).format('hh A');
        },
        formatWeekViewHourColumn(date: Date) {
          return moment(date).format('hh A');
        },
        formatDayViewTitle(date: Date) {
          return moment(date).format('ddd, MMMM Do YYYY');
        },
      };
    }
  }

  /**
   * simply changes the calendarMode
   *
   * @param mode
   */
  changeCalendarMode(mode) {
    this.calMode = mode;
    if (this.translate.currentLang === 'de') {
      this.calendarOptions.locale = 'de';
    } else {
      this.calendarOptions.locale = 'en';
    }
  }

  /**
   * triggered when event is selected in any other view than monthView. Then
   * a modal with information about the event is shown.
   *
   * @param event
   */
  async eventSelected(event: any) {
    if (this.calMode !== 'month') {
      const eventModal = await this.modalCtrl.create({
        backdropDismiss: false,
        component: EventModalPage,
        componentProps: { events: [event], date: event.startTime },
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
   *
   * @param time
   */
  timeSelected(time) {
    if (
      this.calMode === 'month' &&
      time &&
      time.events &&
      time.events.length > 0
    ) {
      this.calMode = 'day';
    }
  }

  /**
   * simply changes the current views title when month/week/day is changed
   *
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
    if (
      event &&
      event.event &&
      event.event.courseDetails &&
      event.event.courseDetails.courseId
    ) {
      const eventColor = this.courseIdToHexColor(
        event.event.courseDetails.courseId
      );
      return this.sanitizer.bypassSecurityTrustStyle(
        'background-color: ' + eventColor + '!important;'
      );
    } else {
      return this.sanitizer.bypassSecurityTrustStyle('');
    }
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
        if (
          this.courseToHex[i] &&
          this.courseToHex[i][0] &&
          this.courseToHex[i][0] === hex
        ) {
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
      backdropDismiss: false,
      mode: 'md',
      buttons: [
        {
          text: this.translate.instant('button.no'),
        },
        {
          text: this.translate.instant('button.yes'),
          handler: async () => {
            let existingCalendars = await this.calendar.listCalendars();
            if (existingCalendars) {
              existingCalendars = convertToArray(existingCalendars);
              if (Array.isArray(existingCalendars)) {
                // ask if the user wants to add the events to an existing calender
                const addToExistingAlert = await this.alertCtrl.create({
                  header: this.translate.instant('alert.addToExistingHeader'),
                  message: this.translate.instant('alert.addToExistingMessage'),
                  backdropDismiss: false,
                  mode: 'md',
                  buttons: [
                    {
                      text: this.translate.instant('button.no'),
                      handler: async () => {
                        let found = false;
                        for (const cal of existingCalendars) {
                          if (
                            cal.name ===
                            this.translate.instant('placeholder.calendarName')
                          ) {
                            found = true;
                            break;
                          }
                        }

                        if (found) {
                          this.calendar
                            .deleteCalendar(
                              this.translate.instant('placeholder.calendarName')
                            )
                            .then(
                              () => {
                                // this.logger.debug(
                                //   'exportPrompt',
                                //   'deleted calendar'
                                // );
                                this.exportCalendar();
                              },
                              (error) => {
                                this.alertService.showToast(
                                  'alert.calendar-export-fail'
                                );
                                // this.logger.error(
                                //   'exportPrompt',
                                //   'calendar deletion',
                                //   error
                                // );
                              }
                            );
                        } else {
                          this.exportCalendar();
                        }
                      },
                    },
                    {
                      text: this.translate.instant('button.yes'),
                      handler: async () => {
                        const calendarInputs = [];
                        for (let i = 0; i < existingCalendars.length; i++) {
                          if (
                            !(
                              existingCalendars[i].type &&
                              existingCalendars[i].type === 'Birthday'
                            )
                          ) {
                            calendarInputs.push({
                              name: existingCalendars[i].name,
                              type: 'radio',
                              label: existingCalendars[i].name,
                              value: i,
                            });
                          }
                        }

                        const chooseCalendarAlert = await this.alertCtrl.create(
                          {
                            header: this.translate.instant(
                              'alert.title.choose'
                            ),
                            inputs: calendarInputs,
                            backdropDismiss: false,
                            mode: 'md',
                            buttons: [
                              {
                                text: this.translate.instant('button.cancel'),
                                role: 'cancel',
                              },
                              {
                                text: this.translate.instant('button.ok'),
                                handler: (data) => {
                                  if (
                                    data &&
                                    existingCalendars &&
                                    existingCalendars[data]
                                  ) {
                                    this.exportCalendar(
                                      existingCalendars[data].name,
                                      existingCalendars[data].id
                                    );
                                  }
                                },
                              },
                            ],
                          }
                        );
                        await chooseCalendarAlert.present();
                      },
                    },
                  ],
                });
                addToExistingAlert.present();
              } else {
                this.exportCalendar();
              }
            } else {
              this.exportCalendar();
            }
          },
        },
      ],
    });
    alert.present();
  }

  exportCalendar(calendarName?: string, calendarID?: string) {
    this.calendar.hasReadWritePermission().then(
      (result) => {
        if (result) {
          // this.logger.debug('exportCalendar', 'calendar access given');
          const createCalendarOpts = this.calendar.getCreateCalendarOptions();
          createCalendarOpts.calendarName = calendarName
            ? calendarName
            : this.translate.instant('placeholder.calendarName');

          if (!calendarName || !calendarID) {
            createCalendarOpts.calendarColor = '#ff9900';
          }

          this.calendar.createCalendar(createCalendarOpts).then(
            async () => {
              let calID;
              if (calendarID) {
                calID = calendarID;
              } else {
                const existingCalendars = await this.calendar.listCalendars();
                if (Array.isArray(existingCalendars)) {
                  for (const cal of existingCalendars) {
                    if (cal.name === createCalendarOpts.calendarName) {
                      calID = cal.id;
                      break;
                    }
                  }
                }
              }

              this.exportFinished = false;
              this.exportedEvents = 0;

              if (
                Array.isArray(this.eventSource) &&
                this.eventSource.length > 0
              ) {
                const loop = dLoop(
                  this.eventSource,
                  (itm: IEventObject, idx, fin) => {
                    if (itm.title && itm.startTime && itm.endTime) {
                      const title = itm.title;
                      const startDate = itm.startTime;
                      const endDate = itm.endTime;

                      let eventLocation = '';
                      if (itm.eventDetails) {
                        if (itm.eventDetails.location) {
                          eventLocation += itm.eventDetails.location;
                        }

                        if (
                          itm.eventDetails.building &&
                          itm.eventDetails.building !== 'N'
                        ) {
                          if (eventLocation !== '') {
                            eventLocation += ': ';
                          }

                          eventLocation += itm.eventDetails.building;

                          if (
                            itm.eventDetails.room &&
                            itm.eventDetails.room !== 'N.'
                          ) {
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

                      this.calendar
                        .createEventWithOptions(
                          title,
                          eventLocation,
                          notes,
                          startDate,
                          endDate,
                          calOptions
                        )
                        .then(
                          () => {
                            // this.logger.debug(
                            //   'exportCalendar',
                            //   'exported event'
                            // );
                            this.exportedEvents++;
                            fin();
                          },
                          (error) => {
                            // this.logger.error(
                            //   'exportCalendar',
                            //   'event creation',
                            //   error
                            // );
                            this.exportedEvents++;
                            this.alertService.showToast(
                              'alert.calendar-event-fail'
                            );
                            fin();
                          }
                        );
                    }
                  }
                );

                loop.then(() => {
                  this.exportFinished = true;
                  this.alertService.showToast('alert.calendar-export-success');
                });
              } else {
                this.exportFinished = true;
              }
            },
            (error) => {
              // this.logger.error('exportCalendar', 'calendar creation', error);
              this.alertService.showToast('alert.calendar-export-fail');
            }
          );
        } else {
          // this.logger.error('exportCalendar', 'calendar access denied');
          this.alertService.showToast('alert.permission-denied');
        }
      },
      (error) => {
        // this.logger.error('exportCalendar', 'cant check permissions', error);
        this.alertService.showToast('alert.calendar-export-fail');
      }
    );
  }
}
