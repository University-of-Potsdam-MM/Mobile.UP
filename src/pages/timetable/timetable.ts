import {Component } from '@angular/core';
import {
  AlertController,
  IonicPage, ModalController,
  NavController, NavParams, ViewController
} from 'ionic-angular';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import {Storage} from "@ionic/storage";
import {
  ISession
} from "../../providers/login-provider/interfaces";
import {Observable} from "rxjs/Observable";
import {
  IPulsAPIResponse_getStudentCourses,
  IPulsApiRequest_getStudentCourses
} from "../../library/interfaces_PULS";
import {LoginPage} from "../login/login";
import {createEventSource, IEventObject,} from "./createEvents";
import {ConfigProvider} from "../../providers/config/config";
import {ITimeSelected} from "ionic2-calendar/calendar";
import * as moment from 'moment';
import {TranslateService} from "@ngx-translate/core";


function debug(text){
  console.log(`[TimetablePage]: ${text}`);
}

@IonicPage()
@Component({
  selector: 'page-timetable',
  templateUrl: 'timetable.html',
})
export class TimetablePage {

  eventSource:IEventObject[] = [];

  // title string that should be displayed for every mode, eg. "24.12.2018"
  currentTitle = "";

  // options for ionic2-calendar component
  calendarOptions = {
    calendarMode: "week",
    currentDate: new Date(),
    locale: "de",
    startingDayWeek: 1,
    startingDayMonth: 1,
    startHour: "8",
    endHour: "20",
    step: "15",
    timeInterval: "120",
    showEventDetail: false,
    autoSelect: false,
    dateFormatter:{
      formatMonthViewDayHeader: function(date:Date) {
        return 'testMDH';
      },
      formatWeekViewDayHeader: function(date:Date) {
        return 'testWDH';
      },
      formatDayViewHourColumn: function(date:Date) {
        return 'testDH';
      },
      formatWeekViewHourColumn: function(date:Date) {
        return 'testWH';
      },
      formatMonthViewTitle: function(date:Date) {
        return 'testMT';
      },
      formatDayViewTitle: function(date:Date) {
        return 'testDT';
      }
    }
  };

  constructor(
      public navCtrl: NavController,
      private http:HttpClient,
      private storage:Storage,
      private alertCtrl:AlertController,
      private translate: TranslateService,
      private modalCtrl:ModalController) {
  }

  ionViewDidLoad(){
    // TODO: check connections
    this.storage.get("session").then(
      (session:ISession) => {
        // check if we have a session
        if(session === null){
          // in case there is no session send the user to LoginPage
          this.navCtrl.push(LoginPage).then(
            () => debug("pushed LoginPage")
          )
        } else {
          // there is a session
          this.getStudentCourses(session).subscribe(
            (response:IPulsAPIResponse_getStudentCourses) => {
              // PULS simply responds with "no user rights" if credentials are incorrect
              if(response.message == "no user rights"){
                // we're having a contradiction here, the password is wrong, but
                // the token is still valid. We'll log the user out and send the
                // user to LoginPage
                let alert = this.alertCtrl.create({
                  title: this.translate.instant("alert.title.error"),
                  subTitle: this.translate.instant("alert.token_valid_credentials_invalid"),
                  buttons: [ this.translate.instant("button.continue") ]
                });
                this.storage.set('session', null);
                this.storage.set('userInformation', null);
                alert.present();
                this.navCtrl.push(LoginPage)
              } else {
                this.eventSource = createEventSource(
                 response.studentCourses.student.actualCourses.course
                );
              }
            },
            error => {
              console.log(error);
            }
          );
        }
      }
    );
  }

  /* ~~~ ionic2-calendar specific methods ~~~ */

  /**
   * simply changes the calendarMode
   * @param mode
   */
  changeCalendarMode(mode){
    this.calendarOptions.calendarMode = mode;
  }

  /**
   * triggered when event is selected in any other view than monthView. Then
   * a modal with information about the event is shown.
   * @param event
   */
  eventSelected(event:IEventObject){
    if(this.calendarOptions.calendarMode != "month"){
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
    if(this.calendarOptions.calendarMode == "month" && time.events.length > 0) {
      let eventModal = this.modalCtrl.create(
        EventModal, {events: time.events, date: time.selectedTime}
      );
      eventModal.present();
    }
  }

  /**
   * simply changes the current views title when month/week/day is changed
   * @param title
   */
  titleChanged(title){
    this.currentTitle= title;
  }

  /**
   * Sends request to PULS webservice and retrieves list of courses the student
   * is currently (current semester) enrolled in.
   * @param {IWebServices} webservices
   * @param {ISession} session
   * @returns {Observable<IPulsAPIResponse_getStudentCourses>}
   */
  private getStudentCourses(session:ISession):Observable<IPulsAPIResponse_getStudentCourses> {

    let headers: HttpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': ConfigProvider.config.webservices.apiToken
    });

    let request:IPulsApiRequest_getStudentCourses = {
      condition:{
        semester: 0,
        allLectures: 0
      },
      // TODO: refactor this someday so credentials are not used
      'user-auth': {
        username: session.credentials.username,
        password: session.credentials.password
      }
    };

    // TODO: check for connection first!

    return this.http.post<IPulsAPIResponse_getStudentCourses>(
      ConfigProvider.config.webservices.endpoint.puls+"getStudentCourses",
      request,
      {headers: headers}
    );
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
