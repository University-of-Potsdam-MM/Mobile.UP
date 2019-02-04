import { Component } from '@angular/core';
import {
  IonicPage, ModalController,
  NavController, NavParams, ViewController, Platform
} from 'ionic-angular';
import { IPulsAPIResponse_getStudentCourses} from "../../library/interfaces_PULS";
import { LoginPage } from "../login/login";
import { createEventSource, IEventObject } from "./createEvents";
import { ITimeSelected } from "ionic2-calendar/calendar";
import * as moment from 'moment';
import { ConnectionProvider } from "../../providers/connection/connection";
import { PulsProvider } from "../../providers/puls/puls";
import { SessionProvider } from '../../providers/session/session';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';

@IonicPage()
@Component({
  selector: 'page-timetable',
  templateUrl: 'timetable.html',
})
export class TimetablePage {

  hexValues = ['#FFCC80', '#9FA8DA', '#A5D6A7', '#B0BEC5', '#ef9a9a', '#90CAF9', '#81D4FA', '#80DEEA', '#80CBC4', '#C5E1A5', '#B39DDB', '#E6EE9C', '#FFE082', '#FFAB91', '#BCAAA4', '#EEEEEE', '#F48FB1', '#CE93D8', '#FFF59D'];
  courseToHex: string[][] = [];
  hexIndex = 0;

  eventSource:IEventObject[] = [];
  noUserRights = false;
  isLoading = true;

  isMobile = true;

  // title string that should be displayed for every mode, eg. "24.12.2018"
  currentTitle = "";

  // options for ionic2-calendar component
  calendarOptions = {
    calendarMode: "day",
    currentDate: new Date(),
    locale: "de",
    startingDayWeek: 1,
    startingDayMonth: 1,
    startHour: "8",
    endHour: "20",
    step: "40",
    timeInterval: "120",
    showEventDetail: false,
    autoSelect: false,
    dateFormatter: undefined
  };

  constructor(
      public navCtrl: NavController,
      private modalCtrl:ModalController,
      private sanitizer: DomSanitizer,
      private translate: TranslateService,
      private platform: Platform,
      private sessionProvider: SessionProvider,
      private connection: ConnectionProvider,
      private puls:PulsProvider) {
  }

  async ionViewWillEnter() {

    if (this.platform.is("tablet") || this.platform.is("core")) {
      this.isMobile = false;
    }

    this.connection.checkOnline(true, true);
    this.setupCalendarOptions();

    let session = JSON.parse(await this.sessionProvider.getSession());

    if (session) {
      this.isLoading = true;
      // there is a session
      this.puls.getStudentCourses(session).subscribe(
        (response:IPulsAPIResponse_getStudentCourses) => {
          if (response.message && response.message == "no user rights") {
            this.noUserRights = true;
            this.isLoading = false;
          } else {
            this.noUserRights = false;
            this.isLoading = false;
            this.eventSource = createEventSource(
              response.studentCourses.student.actualCourses.course
            );
          }
        }
      );
    } else {
      // in case there is no session send the user to LoginPage
      this.navCtrl.push(LoginPage).then(() => console.log("pushed LoginPage"));
      this.isLoading = false;
    }
  }

  /* ~~~ ionic2-calendar specific methods ~~~ */

  setupCalendarOptions() {
    if (this.translate.currentLang == "de") {
      this.calendarOptions.locale = "de";
      let weekString = this.translate.instant("page.timetable.week");
      this.calendarOptions.dateFormatter = {
        formatWeekViewDayHeader: function(date:Date) {
          return moment(date).format("dd. Do");
        },
        formatDayViewHourColumn: function(date:Date) {
          return moment(date).format("HH:mm");
        },
        formatWeekViewHourColumn: function(date:Date) {
          return moment(date).format("HH:mm");
        },
        formatWeekViewTitle: function(date:Date) {
          return moment(date).format("MMMM YYYY") + ", " + weekString + " " + moment(date).format("w");
      },
        formatMonthViewTitle: function(date:Date) {
          return moment(date).format("MMMM YYYY");
        },
        formatDayViewTitle: function(date:Date) {
          return moment(date).format("ddd, Do MMMM YYYY");
        }
      }
    } else {
      this.calendarOptions.locale = "en";
      this.calendarOptions.dateFormatter = {
        formatWeekViewDayHeader: function(date:Date) {
          return moment(date).format("dd. Do");
        },
        formatDayViewHourColumn: function(date:Date) {
          return moment(date).format("hh A");
        },
        formatWeekViewHourColumn: function(date:Date) {
          return moment(date).format("hh A");
        },
        formatDayViewTitle: function(date:Date) {
          return moment(date).format("ddd, MMMM Do YYYY");
        }
      }
    }
  }

  /**
   * simply changes the calendarMode
   * @param mode
   */
  changeCalendarMode(mode) {
    this.calendarOptions.calendarMode = mode;
    if (this.translate.currentLang == "de") {
      this.calendarOptions.locale = "de";
    } else { this.calendarOptions.locale = "en"; }
  }

  /**
   * triggered when event is selected in any other view than monthView. Then
   * a modal with information about the event is shown.
   * @param event
   */
  eventSelected(event:IEventObject) {
    if(this.calendarOptions.calendarMode != "month") {
      let eventModal = this.modalCtrl.create(
        EventModal,
        {events: [event], date: event.startTime}
      );
      eventModal.present();
    }
  }

  /**
   * triggred when a time is clicked. Here a modal is shown when a time is
   * clicked in monthView and there are events at this timeslot.
   * @param time
   */
  timeSelected(time:ITimeSelected) {
    // if(this.calendarOptions.calendarMode == "month" && time.events.length > 0) {
    //   let eventModal = this.modalCtrl.create(
    //     EventModal, {events: time.events, date: time.selectedTime}
    //   );
    //   eventModal.present();
    // }

    if (this.calendarOptions.calendarMode == "month" && time.events.length > 0) {
      this.calendarOptions.calendarMode = "day";
    }
  }

  /**
   * simply changes the current views title when month/week/day is changed
   * @param title
   */
  titleChanged(title){
    this.currentTitle= title;
  }

  swipePrevious() {
    var mySwiper = document.querySelector('.swiper-container')['swiper'];
    mySwiper.slidePrev();
  }

  swipeNext() {
    var mySwiper = document.querySelector('.swiper-container')['swiper'];
    mySwiper.slideNext();
  }

  getColor(event) {
    let eventColor = this.courseIdToHexColor(event.event.courseDetails.courseId);
    return this.sanitizer.bypassSecurityTrustStyle("background-color: " + eventColor + "!important;");
  }

  /**
   * @name courseIdToHexColor
   * @description converts course id to hex string
   * @param d {number} decimal number
   * @returns {string} 3 byte hex color string
   */
  courseIdToHexColor(d) {
    let padding = 6;
    let hex = Number(d).toString(16);
    while (hex.length < padding) {
      hex = "0" + hex;
    }

    if (this.hexIndex < this.hexValues.length) {
      var i;
      var found = false;
      for (i = 0; i < this.courseToHex.length; i++) {
        if (this.courseToHex[i] && this.courseToHex[i][0] == hex) {
          found = true;
          return this.courseToHex[i][1];
        }
      }

      if (!found) {
        this.courseToHex[this.hexIndex] = [];
        this.courseToHex[this.hexIndex][0] = hex;
        this.courseToHex[this.hexIndex][1] = this.hexValues[this.hexIndex];
        this.hexIndex = this.hexIndex + 1;
        return this.courseToHex[this.hexIndex-1][1];
      }

    } else {
      return `#${hex}`;
    }
  }

}


/**
 * Component for the modal to be shown when an event is selected
 */
@Component({
  selector: 'event',
  templateUrl: 'eventModal.html',
})
export class EventModal {

  isArray = Array.isArray;
  moment = moment;

  events:IEventObject[] = null;
  date = null;

  constructor(private params: NavParams,
              private view:ViewController) {
    this.events = this.params.get('events');
    this.date = this.params.get('date');
  }

  closeModal(){
    this.view.dismiss();
  }
}
