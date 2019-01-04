import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { CacheService } from 'ionic-cache';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IConfig } from '../../library/interfaces';
import * as opening from 'opening_hours';
import { TranslateService } from '@ngx-translate/core';
import { DetailedOpeningPage } from '../detailed-opening/detailed-opening';
import { Platform } from 'ionic-angular';
import { Keyboard } from '@ionic-native/keyboard';
import {ConnectionProvider} from "../../providers/connection/connection";

@IonicPage()
@Component({
  selector: 'page-opening-hours',
  templateUrl: 'opening-hours.html',
})
export class OpeningHoursPage {

  openingHours;
  parsedOpenings = [];
  allOpeningHours;

  nominatim;
  weekday = [];
  isLoaded;

  constructor(public navCtrl: NavController,
              public navParams: NavParams,
              private translate: TranslateService,
              private storage: Storage,
              private cache: CacheService,
              private platform: Platform,
              private keyboard: Keyboard,
              private http: HttpClient,
              private connection: ConnectionProvider) {
  }

  ngOnInit() {
    this.connection.checkOnline(true, true);
    this.loadOpeningHours();
  }

  async loadOpeningHours() {
    this.isLoaded = false;
    let config:IConfig = await this.storage.get("config");

    // needed for providing the country code to opening_hours?
    // maybe put lat / lon in config and fetch?
    this.http.get("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=52.40093096&lon=13.0591397").subscribe(data => {
      this.nominatim = data;

      let headers: HttpHeaders = new HttpHeaders()
      .append("Authorization", config.webservices.apiToken);

      var url = config.webservices.endpoint.openingHours;
      let request = this.http.get(url, {headers:headers});
      this.cache.loadFromObservable("openingHours", request).subscribe((response) => {
        this.allOpeningHours = response;
        this.openingHours = response;

        var i;
        for (i = 0; i < this.openingHours.length; i++) {
          this.parsedOpenings[i] = new opening(this.openingHours[i].opening_hours, this.nominatim, { 'locale': this.translate.currentLang });
        }
        this.isLoaded = true;
      });
    });
  }

  // hides keyboard once the user is scrolling
  onScrollListener() {
    if (this.platform.is("cordova") && (this.platform.is("ios") || this.platform.is("android"))) {
      this.keyboard.hide();
    }
  }

  itemSelected(item, index) {
    this.navCtrl.push(DetailedOpeningPage, { "item": item, "parsed": this.parsedOpenings[index] });
  }

  openUntil(index) {
    var from = new Date();
    var to = new Date();
    to.setDate(to.getDate() + 6);
    to.setHours(23,59,59,999);
    let willClose: Date = this.parsedOpenings[index].getNextChange(from, to);

    if (willClose) {
      if (this.isToday(willClose)) {
        return this.translate.instant("page.openingHours.closes") + this.addZero(willClose.getHours()) + ":" + this.addZero(willClose.getMinutes()) + this.translate.instant("page.openingHours.time");
      } else {
        return this.translate.instant("page.openingHours.closes") + this.weekday[willClose.getDay()] + this.addZero(willClose.getHours()) + ":" + this.addZero(willClose.getMinutes()) + this.translate.instant("page.openingHours.time");
      }
    } else {
      return "";
    }
  }

  closedUntil(index) {
    var from = new Date();
    var to = new Date();
    to.setDate(to.getDate() + 6);
    to.setHours(23,59,59,999);

    let willChange: Date = this.parsedOpenings[index].getNextChange(from, to);

    if (willChange) {
      if (this.isToday(willChange)) {
        return this.translate.instant("page.openingHours.opens") + this.addZero(willChange.getHours()) + ":" + this.addZero(willChange.getMinutes()) + this.translate.instant("page.openingHours.time");
      } else {
        return this.translate.instant("page.openingHours.opens") + this.weekday[willChange.getDay()] + this.addZero(willChange.getHours()) + ":" + this.addZero(willChange.getMinutes()) + this.translate.instant("page.openingHours.time");
      }
    } else {
      if (this.parsedOpenings[index].getComment() != null) {
        if (this.translate.currentLang == "en" && this.parsedOpenings[index].getComment() == "nach Vereinbarung") {
          return "by appointment only";
        } else if (this.parsedOpenings[index].getComment() == "nach Vereinbarung") {
          return this.parsedOpenings[index].getComment();
        } else {
          return "";
        }
      } else {
        return "";
      }
    }
  }

   isToday(td) {
    var d = new Date();
    return td.getDate() == d.getDate() && td.getMonth() == d.getMonth() && td.getFullYear() == d.getFullYear();
  }

  addZero(i) {
    if (i < 10) {
      i = "0"+i;
    }
    return i;
  }

  ionViewDidEnter() {
    this.weekday = [];
    if (this.translate.currentLang == "de") {
      this.weekday[0] = "So. ";
      this.weekday[1] = "Mo. ";
      this.weekday[2] = "Di. ";
      this.weekday[3] = "Mi. ";
      this.weekday[4] = "Do. ";
      this.weekday[5] = "Fr. ";
      this.weekday[6] = "Sa. ";
    } else {
      this.weekday[0] = "Su. ";
      this.weekday[1] = "Mo. ";
      this.weekday[2] = "Tu. ";
      this.weekday[3] = "We. ";
      this.weekday[4] = "Th. ";
      this.weekday[5] = "Fr. ";
      this.weekday[6] = "Sa. ";
    }
  }

  filterItems(event) {
    let val =  event.target.value;
    this.openingHours = this.allOpeningHours;

    if (val && val.trim() !== '') {
      this.openingHours = this.openingHours.filter(function(item) {
        return item.name.toLowerCase().includes(val.toLowerCase());
      })
    }
  }

}
