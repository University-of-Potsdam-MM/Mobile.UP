import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { CacheService } from 'ionic-cache';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IConfig } from '../../library/interfaces';
import * as opening from 'opening_hours';
import { TranslateService } from '@ngx-translate/core';
import { DetailedOpeningPage } from '../detailed-opening/detailed-opening';

@IonicPage()
@Component({
  selector: 'page-opening-hours',
  templateUrl: 'opening-hours.html',
})
export class OpeningHoursPage {

  openingHours;
  parsedOpenings = [];

  // needed for providing the country code to opening_hours? 
  // maybe put lat / lon in config and fetch?
  // https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=52.40093096&lon=13.0591397
  nominatim = {"place_id":"148441555","licence":"Data © OpenStreetMap contributors, ODbL 1.0. https:\/\/osm.org\/copyright","osm_type":"way","osm_id":"308913303","lat":"52.40055285","lon":"13.0599716599567","place_rank":"30","category":"amenity","type":"parking","importance":"0","addresstype":"amenity","name":"Busparkplatz","display_name":"Busparkplatz, Bassinplatz, Nördliche Innenstadt, Innenstadt, Potsdam, Brandenburg, 14467, Deutschland","address":{"parking":"Busparkplatz","pedestrian":"Bassinplatz","suburb":"Nördliche Innenstadt","city":"Potsdam","state":"Brandenburg","postcode":"14467","country":"Deutschland","country_code":"de"},"boundingbox":["52.400269","52.4008264","13.0593486","13.060619"]}

  constructor(public navCtrl: NavController, public navParams: NavParams, private translate: TranslateService, private storage: Storage, private cache: CacheService, private http: HttpClient) {
  }

  ngOnInit() {
    this.loadOpeningHours();
  }

  async loadOpeningHours() {
    let config:IConfig = await this.storage.get("config");

    let headers: HttpHeaders = new HttpHeaders()
      .append("Authorization", config.webservices.apiToken);

    var url = config.webservices.endpoint.openingHours;
    let request = this.http.get(url, {headers:headers});
    this.cache.loadFromObservable("openingHours", request).subscribe((response) => {
      console.log(response);
      this.openingHours = response;

      var i;
      for (i = 0; i < this.openingHours.length; i++) {
        this.parsedOpenings[i] = new opening(this.openingHours[i].opening_hours, this.nominatim, { 'locale': this.translate.currentLang });
      }
    });
  }

  itemSelected(item, index) {
    this.navCtrl.push(DetailedOpeningPage, { "item": item, "parsed": this.parsedOpenings[index] });
  }

  openUntil(index) {
    let willClose: Date = this.parsedOpenings[index].getNextChange();

    if (willClose) {
      if (this.isToday(willClose)) {
        return this.translate.instant("page.openingHours.closes") + this.addZero(willClose.getHours()) + ":" + this.addZero(willClose.getMinutes()) + this.translate.instant("page.openingHours.time");
      } else {
        return this.translate.instant("page.openingHours.closes") + this.weekday(willClose.getDay()) + this.addZero(willClose.getHours()) + ":" + this.addZero(willClose.getMinutes()) + this.translate.instant("page.openingHours.time");
      }
    } else if (this.parsedOpenings[index].getComment() != null) {
      return this.parsedOpenings[index].getComment();
    } else {
      return "";
    }
  }

  closedUntil(index) {
    let willChange: Date = this.parsedOpenings[index].getNextChange();

    if (willChange) {
      if (this.isToday(willChange)) {
        return this.translate.instant("page.openingHours.opens") + this.addZero(willChange.getHours()) + ":" + this.addZero(willChange.getMinutes()) + this.translate.instant("page.openingHours.time");
      } else {
        return this.translate.instant("page.openingHours.opens") + this.weekday(willChange.getDay()) + this.addZero(willChange.getHours()) + ":" + this.addZero(willChange.getMinutes()) + this.translate.instant("page.openingHours.time");
      }
    } else {
      if (this.parsedOpenings[index].getComment() != null) {
        if (this.translate.currentLang == "en" && this.parsedOpenings[index].getComment() == "nach Vereinbarung") {
          return "by appointment only";
        } else {
          return this.parsedOpenings[index].getComment();
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

  weekday(i) {
    let weekday = [];
    if (this.translate.currentLang == "de") {
      weekday[0] = "So. ";
      weekday[1] = "Mo. ";
      weekday[2] = "Di. ";
      weekday[3] = "Mi. ";
      weekday[4] = "Do. ";
      weekday[5] = "Fr. ";
      weekday[6] = "Sa. ";
    } else {
      weekday[0] = "Su. ";
      weekday[1] = "Mo. ";
      weekday[2] = "Tu. ";
      weekday[3] = "We. ";
      weekday[4] = "Th. ";
      weekday[5] = "Fr. ";
      weekday[6] = "Sa. ";
    }
    return weekday[i];
  }

}
