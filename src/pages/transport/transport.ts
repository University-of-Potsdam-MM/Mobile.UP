import { Component, Host } from '@angular/core';
import { IonicPage, NavController, NavParams, Events, InfiniteScroll, Platform } from 'ionic-angular';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Storage } from "@ionic/storage";
import { IConfig, IJourneyResponse } from "../../library/interfaces";
import { ConnectionProvider } from "../../providers/connection/connection";
import moment from 'moment';


@IonicPage()
@Component({
  selector: 'page-transport',
  templateUrl: 'transport.html',
})
export class TransportPage {

  currentDate;
  isLoaded = false;
  hardRefresh = false;
  campus;
  campusid;
  departures = [];
  isEnd = false;
  maxJourneys = 15;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private http: HttpClient,
    private connection: ConnectionProvider,
    private swipeEvent: Events,
    private storage: Storage){
  }

  ionViewDidLoad() {
    this.connection.checkOnline(true, true);
  }

  public async changeCampus(campus) {
    this.campus = campus;
    this.loadCampusMenu();
  }

  async loadCampusMenu(refresher?, infiniteScroll?) {
    this.currentDate = moment();
    this.isEnd = false;

    if (refresher) {
      this.hardRefresh = true;
    } else if (!infiniteScroll) {
      this.isLoaded = false;
    }

    if (!infiniteScroll) { this.maxJourneys = 15; }

    let config:IConfig = await this.storage.get("config");

    let headers: HttpHeaders = new HttpHeaders()
      .append("Authorization", config.webservices.apiToken);

    if(this.campus=="Griebnitzsee"){
      this.campusid  = '900230003';
    } else if (this.campus=="Golm"){
      this.campusid = '900220365';
    } else {
      this.campusid = '900230133';
    }

    let params: HttpParams = new HttpParams()
      .append("maxJourneys", this.maxJourneys.toString())
      .append("format", "json")
      .append("time", this.currentDate.format('HH:mm:ss'))
      .append("id", this.campusid);

    this.http.get(config.webservices.endpoint.transport, {headers:headers, params:params}).subscribe((res:IJourneyResponse) => {

      if (res && res.Departure && !infiniteScroll) {
        this.departures = res.Departure;
      } else if (res && res.Departure && infiniteScroll) {
        var i;
        console.log(this.departures.length);
        for (i = 0; i < res.Departure.length; i++) {
          if (!this.isInArray(this.departures, res.Departure[i])) {
            this.departures.push(res.Departure[i]);
          }
        }
        console.log(this.departures.length);
      }

      if (this.maxJourneys > this.departures.length) {
        this.isEnd = true;
      }

      if (refresher) {
        refresher.complete();
      }
      this.hardRefresh = false;
      this.isLoaded = true;
      if (infiniteScroll) { infiniteScroll.complete(); }
    }, error => {
      if (infiniteScroll) { infiniteScroll.complete(); }
      console.log(error);
    });
  }


  doInfinite(infiniteScroll) {
    this.maxJourneys+= 10;
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

  isInArray(array, value) { // checks if value is in array
    var i;
    var found = false;
    for (i = 0; i < array.length; i++) {
      if (array[i].JourneyDetailRef.ref == value.JourneyDetailRef.ref) {
        found = true;
      }
    }
    return found;
  }

}
