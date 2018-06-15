import { HttpHeaders, HttpParams, HttpClient } from '@angular/common/http';
import { IConfig, INewsApiResponse } from './../../library/interfaces';
import { Storage } from '@ionic/storage';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

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
