import { TranslateService } from '@ngx-translate/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { IConfig, INewsApiResponse } from './../../library/interfaces';
import { Storage } from '@ionic/storage';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import * as moment from 'moment';

@IonicPage()
@Component({
  selector: 'page-events',
  templateUrl: 'events.html',
})
export class EventsPage {

  eventsList;
  todaysEventsList = [];

  locationsList = [];
  todaysLocationsList = [];

  eventLocation = "0";
  timespan = 0;

  eventsToday = false;
  eventsNext = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, private storage:Storage, private http: HttpClient, private translate: TranslateService) {
  }

  async ngOnInit() {

    this.todaysLocationsList.push(this.translate.instant("page.events.noEventCategory"));

    let config: IConfig = await this.storage.get("config");

    let headers: HttpHeaders = new HttpHeaders()
      .append("Authorization", config.webservices.apiToken);

    var url = config.webservices.endpoint.events;
    this.http.get(url, {headers:headers}).subscribe((response:INewsApiResponse) => {
      if (response.errors.exist == false) {
        this.eventsList = response.vars.events;

        var i;
        for (var loc in response.vars.places) {
          for (i = 0; i < this.eventsList.length; i++) {
            // check if there are events for location
            // hide locations with zero events
            this.checkTodaysEvents(this.eventsList[i]);
            if (response.vars.places[loc] == this.eventsList[i].Place.name) {
              this.locationsList.push(response.vars.places[loc]);
              break;
            }
          }
        }
      }
    })

  }

  checkTodaysEvents(event) {
    var timeBegin = moment(event.Event.startTime * 1000);
    var currentTime = moment();
    var isToday = currentTime.isSame(timeBegin, "day");

    if (isToday) {
      this.todaysEventsList.push(event);
      this.eventsToday = true;

      var i;
      var alreadyAdded = false;

      for (i = 0; i < this.todaysLocationsList.length; i++) {
        if (this.todaysLocationsList[0] == this.translate.instant("page.events.noEventCategory")) {
          this.todaysLocationsList[0] = event.Place.name;
          alreadyAdded = true;
        } else if (this.todaysLocationsList[i] == event.Place.name) {
          alreadyAdded = true;
        }
      }

      if (!alreadyAdded) {
        this.todaysLocationsList.push(event.Place.name);
      }

    }
  }

  setLocation(i) {
    this.eventLocation = i;
  }

  setTimespan(i) {
    this.eventLocation = "0";
    this.timespan = i;
  }

  isActive(i) {
    if (this.eventLocation == i) {
      return "primary"
    } else {
      return "secondary"
    }
  }

  isActiveTimespan(i) {
    if (this.timespan == i) {
      return "primary"
    } else {
      return "secondary"
    }
  }

}
