import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';

@IonicPage()
@Component({
  selector: 'page-detailed-opening',
  templateUrl: 'detailed-opening.html',
})
export class DetailedOpeningPage {

  item;
  parsedOpening;

  constructor(public navCtrl: NavController, public navParams: NavParams, private translate: TranslateService) {
    this.item = this.navParams.data.item;
    this.parsedOpening = this.navParams.data.parsed;
  }

  shortenLink(link:string) {
    if (link.length > 30) {
      return link.substr(0, 30) + "..."
    } else { return link }
  }

  openUntil() {
    let willClose: Date = this.parsedOpening.getNextChange();

    if (willClose) {
      if (this.isToday(willClose)) {
        return this.translate.instant("page.openingHours.closes") + this.addZero(willClose.getHours()) + ":" + this.addZero(willClose.getMinutes()) + this.translate.instant("page.openingHours.time");
      } else {
        return this.translate.instant("page.openingHours.closes") + this.weekday(willClose.getDay()) + this.addZero(willClose.getHours()) + ":" + this.addZero(willClose.getMinutes()) + this.translate.instant("page.openingHours.time");
      }
    } else if (this.parsedOpening.getComment() != null) {
      return this.parsedOpening.getComment();
    } else {
      return "";
    }
  }

  closedUntil() {
    let willChange: Date = this.parsedOpening.getNextChange();

    if (willChange) {
      if (this.isToday(willChange)) {
        return this.translate.instant("page.openingHours.opens") + this.addZero(willChange.getHours()) + ":" + this.addZero(willChange.getMinutes()) + this.translate.instant("page.openingHours.time");
      } else {
        return this.translate.instant("page.openingHours.opens") + this.weekday(willChange.getDay()) + this.addZero(willChange.getHours()) + ":" + this.addZero(willChange.getMinutes()) + this.translate.instant("page.openingHours.time");
      }
    } else {
      if (this.parsedOpening.getComment() != null) {
        if (this.translate.currentLang == "en" && this.parsedOpening.getComment() == "nach Vereinbarung") {
          return "by appointment only";
        } else {
          return this.parsedOpening.getComment();
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
