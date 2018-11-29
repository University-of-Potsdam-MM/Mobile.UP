import {Component } from '@angular/core';
import {
  AlertController,
  IonicPage, ModalController,
  NavController, NavParams, ViewController
} from 'ionic-angular';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { IWebServices } from "../../library/interfaces";
import {Storage} from "@ionic/storage";
import {ISession} from "../../providers/login-provider/interfaces";
import {Observable} from "rxjs/Observable";
import {
  IPulsAPIResponse_getStudentCourses,
  IPulsApiRequest_getStudentCourses
} from "../../library/interfaces_PULS";
import {LoginPage} from "../login/login";
import {createEventSource, IEventObject,} from "./createEvents";
import {TranslateService} from "@ngx-translate/core";
import {ConfigProvider} from "../../providers/config/config";
import {NgCalendarModule} from "ionic2-calendar";
import {ITimeSelected} from "ionic2-calendar/calendar";
import * as moment from 'moment';


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

  calendarOptions = {
    calendarMode: "week",
    currentDate: new Date(),
    locale: "de-DE",
    startingDayWeek: 1,
    startingDayMonth: 1,
    startHour: "8",
    endHour: "20",
    step: "15",
    timeInterval: "120",
    showEventDetail: false,
    dateFormatter: {
      formatMonthViewDay: function(date:Date) {
        return date.getDate().toString();
      },
      formatMonthViewDayHeader: function(date:Date) {
        return 'testMDH';
      },
      formatMonthViewTitle: function(date:Date) {
        return 'testMT';
      },
      formatWeekViewDayHeader: function(date:Date) {
        return 'testWDH';
      },
      formatWeekViewTitle: function(date:Date) {
        return 'testWT';
      },
      formatWeekViewHourColumn: function(date:Date) {
        return 'testWH';
      },
      formatDayViewHourColumn: function(date:Date) {
        return 'testDH';
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
      private calendar:NgCalendarModule,
      private translate:TranslateService,
      private alertCtrl:AlertController,
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
              this.eventSource = createEventSource(
               response.studentCourses.student.actualCourses.course
              );
            }
          );
        }
      }
    );
  }

  /* ionic2-calendar specific methods */

  changeCalendarMode(mode){
    this.calendarOptions.calendarMode = mode;
  }

  eventClicked(event:IEventObject){
    console.log("event")
    if(this.calendarOptions.calendarMode != "month"){
      let eventModal = this.modalCtrl.create(
        EventModal,
        {events: [event], date: event.startTime}
      );
      eventModal.present();
    }
  }

  timeClicked(time:ITimeSelected) {
    console.log("time")

    if(this.calendarOptions.calendarMode == "month") {
      let eventModal = this.modalCtrl.create(
        EventModal, {events: time.events, date: time.selectedTime}
      );
      eventModal.present();
    }
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

    return this.http.post<IPulsAPIResponse_getStudentCourses>(
      ConfigProvider.config.webservices.endpoint.puls+"getStudentCourses",
      request,
      {headers: headers}
    );
  }
}


@Component({
  selector: 'event',
  templateUrl: 'eventModal.html',
})
export class EventModal {

  isArray = Array.isArray;
  moment = moment;

  events:IEventObject[] = [];
  date = null;

  constructor(private params: NavParams,
              private view:ViewController) {
    this.events = params.get('events');
    this.date = params.get('date');
  }

  closeModal(){
    this.view.dismiss();
  }
}
