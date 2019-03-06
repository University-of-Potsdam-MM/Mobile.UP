import { Component, OnInit } from '@angular/core';
import { HttpParams, HttpHeaders, HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { Events } from '@ionic/angular';
import { ConnectionService } from 'src/app/services/connection/connection.service';
import { IConfig, IJourneyResponse } from 'src/app/lib/interfaces';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-transport',
  templateUrl: './transport.page.html',
  styleUrls: ['./transport.page.scss'],
})
export class TransportPage implements OnInit {

  currentDate;
  isLoaded = false;
  hardRefresh = false;
  campus;
  campusid;
  departures = [];
  isEnd = false;
  maxJourneys = 15;

  error = null;

  constructor(
    private connection: ConnectionService,
    private http: HttpClient,
    private swipeEvent: Events
  ) { }

  ngOnInit() {
    this.connection.checkOnline(true, true);
  }

  changeCampus(campus) {
    this.campus = campus;
    this.loadCampusMenu();
  }

  loadCampusMenu(refresher?, infiniteScroll?) {
    this.currentDate = moment();
    this.isEnd = false;

    if (refresher) {
      this.hardRefresh = true;
    } else if (!infiniteScroll) {
      this.isLoaded = false;
    }

    if (!infiniteScroll) { this.maxJourneys = 15; }

    const config: IConfig = ConfigService.config;

    const headers: HttpHeaders = new HttpHeaders()
      .append('Authorization', config.webservices.apiToken);

    if (this.campus === 'Griebnitzsee') {
      this.campusid  = '900230003';
    } else if (this.campus === 'Golm') {
      this.campusid = '900220365';
    } else {
      this.campusid = '900230133';
    }

    this.error = null;

    const params: HttpParams = new HttpParams()
      .append('maxJourneys', this.maxJourneys.toString())
      .append('format', 'json')
      .append('time', this.currentDate.format('HH:mm:ss'))
      .append('id', this.campusid);

    this.http.get(config.webservices.endpoint.transport, {headers: headers, params: params}).subscribe((res: IJourneyResponse) => {

      if (res && res.Departure && !infiniteScroll) {
        this.departures = res.Departure;
      } else if (res && res.Departure && infiniteScroll) {
        for (let i = 0; i < res.Departure.length; i++) {
          let found = false;
          for (let j = 0; j < this.departures.length; j++) {
            if (this.departures[j].JourneyDetailRef.ref === res.Departure[i].JourneyDetailRef.ref) {
              found = true;
            }
          }

          if (!found) {
            this.departures.push(res.Departure[i]);
          }
        }
      }

      if (this.maxJourneys > this.departures.length) {
        this.isEnd = true;
      }

      if (refresher) {
        refresher.target.complete();
      }

      this.hardRefresh = false;
      this.isLoaded = true;
      if (infiniteScroll) { infiniteScroll.target.complete(); }
    }, error => {
      if (infiniteScroll) { infiniteScroll.target.complete(); }
      console.log(error);
      this.error = error;
    });
  }


  doInfinite(infiniteScroll) {
    this.maxJourneys += 10;
    this.loadCampusMenu(false, infiniteScroll);
  }


  swipeCampus(event) {
    if (Math.abs(event.deltaY) < 50) {
      if (event.deltaX > 0) {
        // user swiped from left to right
        this.swipeEvent.publish('campus-swipe-to-right', this.campus);
      } else if (event.deltaX < 0) {
        // user swiped from right to left
        this.swipeEvent.publish('campus-swipe-to-left', this.campus);
      }
    }
  }

}
