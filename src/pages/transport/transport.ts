import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Storage } from "@ionic/storage";
import { IConfig, IJourneyResponse } from "../../library/interfaces";
import { CacheService } from 'ionic-cache';
import { ConnectionProvider } from "../../providers/connection/connection";
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';


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
  departures;
  maxJourneys = 10;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private http: HttpClient,
    private cache: CacheService,
    private connection: ConnectionProvider,
    private translate: TranslateService,
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

    if (refresher) {
      this.hardRefresh = true;
    } else {
      this.isLoaded = false;
    }

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

      if (res) {
        console.log(res);
        this.departures = res.Departure;
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

}
