import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CacheService } from 'ionic-cache';
import * as opening from 'opening_hours';
import { TranslateService } from '@ngx-translate/core';
import { Platform, ModalController } from '@ionic/angular';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { DetailedOpeningModalPage } from './detailed-opening.modal';
import { ConnectionService } from 'src/app/services/connection/connection.service';
import { IConfig } from 'src/app/lib/interfaces';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'app-opening-hours',
  templateUrl: './opening-hours.page.html',
  styleUrls: ['./opening-hours.page.scss'],
})
export class OpeningHoursPage implements OnInit {

  openingHours;
  allOpeningHours;

  nominatim;
  weekday = [];
  isLoaded;
  modalOpen = false;

  constructor(
    private connection: ConnectionService,
    private http: HttpClient,
    private cache: CacheService,
    private translate: TranslateService,
    private platform: Platform,
    private keyboard: Keyboard,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    this.connection.checkOnline(true, true);
    this.loadOpeningHours();
  }

  loadOpeningHours(refresher?) {

    const config: IConfig = ConfigService.config;

    // needed for providing the country code to opening_hours?
    // maybe put lat / lon in config and fetch?
    this.http.get('https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=52.40093096&lon=13.0591397').subscribe(data => {
      this.nominatim = data;

      const headers: HttpHeaders = new HttpHeaders()
      .append('Authorization', config.webservices.apiToken);

      const url = config.webservices.endpoint.openingHours;
      const request = this.http.get(url, {headers: headers});

      if (refresher) {
        this.cache.removeItem('openingHours');
      } else {
        this.isLoaded = false;
      }

      this.cache.loadFromObservable('openingHours', request).subscribe((response) => {
        this.allOpeningHours = response;

        const from = new Date();
        const to = new Date();
        to.setDate(to.getDate() + 6);
        to.setHours(23, 59, 59, 999);

        for (let i = 0; i < this.allOpeningHours.length; i++) {
          this.allOpeningHours[i].parsedOpening = new opening(
            this.allOpeningHours[i].opening_hours,
            this.nominatim,
            { 'locale': this.translate.currentLang });

          this.allOpeningHours[i].nextChange = this.allOpeningHours[i].parsedOpening.getNextChange(from, to);

          this.allOpeningHours[i].state = this.allOpeningHours[i].parsedOpening.getState();
        }

        this.openingHours = this.sortOpenings(this.allOpeningHours);
        this.isLoaded = true;

        if (refresher) {
          refresher.target.complete();
        }
      });
    });
  }

  sortOpenings(openArray): any[] {
    return openArray.sort((a, b) => {
      const changeA = a.nextChange;
      const changeB = b.nextChange;
      if (changeA === undefined) {
        // sort B before A, because state of A doesnt change in the next 6 days
        return 1;
      } else if (changeB === undefined) {
        // sort A before B, because state of B doesnt change in the next 6 days
        return -1;
      } else {
        // sort depending on whether state of A or B changes first
        return changeA - changeB;
      }
    });
  }

  // hides keyboard once the user is scrolling
  onScrollListener() {
    if (this.platform.is('cordova') && (this.platform.is('ios') || this.platform.is('android'))) {
      this.keyboard.hide();
    }
  }

  async itemSelected(item) {
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: DetailedOpeningModalPage,
      componentProps: { item: item }
    });
    modal.present();
    this.modalOpen = true;
    await modal.onDidDismiss();
    this.modalOpen = false;
  }

  openUntil(index) {
    const willClose: Date = this.openingHours[index].nextChange;

    if (willClose) {
      if (this.isToday(willClose)) {
        return this.translate.instant('page.opening-hours.closes')
        + this.addZero(willClose.getHours()) + ':'
        + this.addZero(willClose.getMinutes())
        + this.translate.instant('page.opening-hours.time');
      } else {
        return this.translate.instant('page.opening-hours.closes')
        + this.weekday[willClose.getDay()]
        + this.addZero(willClose.getHours()) + ':'
        + this.addZero(willClose.getMinutes())
        + this.translate.instant('page.opening-hours.time');
      }
    } else {
      return '';
    }
    return '';
  }

  closedUntil(index) {
    const willChange: Date = this.openingHours[index].nextChange;

    if (willChange) {
      if (this.isToday(willChange)) {
        return this.translate.instant('page.opening-hours.opens')
        + this.addZero(willChange.getHours()) + ':'
        + this.addZero(willChange.getMinutes())
        + this.translate.instant('page.opening-hours.time');
      } else {
        return this.translate.instant('page.opening-hours.opens')
        + this.weekday[willChange.getDay()]
        + this.addZero(willChange.getHours()) + ':'
        + this.addZero(willChange.getMinutes())
        + this.translate.instant('page.opening-hours.time');
      }
    } else {
      const comment = this.openingHours[index].parsedOpening.getComment();
      if (comment != null) {
        if (this.translate.currentLang === 'en' && comment === 'nach Vereinbarung') {
          return 'by appointment only';
        } else if (comment === 'nach Vereinbarung') {
          return comment;
        } else {
          return '';
        }
      } else {
        return '';
      }
    }
  }

  isToday(td) {
    const d = new Date();
    return td.getDate() === d.getDate() && td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
  }

  addZero(i) {
    if (i < 10) {
      i = '0' + i;
    }
    return i;
  }

  ionViewDidEnter() {
    this.weekday = [];
    if (this.translate.currentLang === 'de') {
      this.weekday[0] = 'So. ';
      this.weekday[1] = 'Mo. ';
      this.weekday[2] = 'Di. ';
      this.weekday[3] = 'Mi. ';
      this.weekday[4] = 'Do. ';
      this.weekday[5] = 'Fr. ';
      this.weekday[6] = 'Sa. ';
    } else {
      this.weekday[0] = 'Su. ';
      this.weekday[1] = 'Mo. ';
      this.weekday[2] = 'Tu. ';
      this.weekday[3] = 'We. ';
      this.weekday[4] = 'Th. ';
      this.weekday[5] = 'Fr. ';
      this.weekday[6] = 'Sa. ';
    }
  }

  filterItems(event) {
    const val =  event.target.value;
    this.openingHours = this.allOpeningHours;

    if (val && val.trim() !== '') {
      this.openingHours = this.openingHours.filter(function(item) {
        return item.name.toLowerCase().includes(val.toLowerCase());
      });
    }
  }

}
