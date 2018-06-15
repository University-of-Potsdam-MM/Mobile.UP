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
  locationsList = [];
  eventLocation = "0";
  timespan = 0;

  constructor(public navCtrl: NavController, public navParams: NavParams, private storage:Storage, private http: HttpClient) {
  }

  async ngOnInit() {

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
            if (response.vars.places[loc] == this.eventsList[i].Place.name) {
              this.locationsList.push(response.vars.places[loc]);
              break;
            }
          }
        }
      }
    })

  }

  isInTimespan(event) {

    if (this.timespan == 0) {

      return true;

    } else {

      var timeBegin = moment(event.Event.startTime * 1000);
      var timeEnd = moment(event.Event.endTime * 1000);
      var currentTime = moment();
      var isToday = currentTime.isSame(timeBegin, "day");

      // TODO: naechste soll max. 3 events pro kategorie anzeigen
      if (isToday) {
        if (this.timespan == 1) { return true; } else { return false; }
      } else {
        if (this.timespan == 1) { return false; } else { return true; }
      }
    }

  }

  setLocation(i) {
    this.eventLocation = i;
  }

  setTimespan(i) {
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
