import { Component, OnInit } from "@angular/core";
import * as opening from "opening_hours";
import { TranslateService } from "@ngx-translate/core";
import { ModalController } from "@ionic/angular";
import { Keyboard } from "@ionic-native/keyboard/ngx";
import { DetailedOpeningModalPage } from "./detailed-opening.modal";
import { AbstractPage } from "src/app/lib/abstract-page";
import { WebserviceWrapperService } from "../../services/webservice-wrapper/webservice-wrapper.service";

@Component({
  selector: "app-opening-hours",
  templateUrl: "./opening-hours.page.html",
  styleUrls: ["./opening-hours.page.scss"],
})
export class OpeningHoursPage extends AbstractPage implements OnInit {
  openingHours = [];
  allOpeningHours: any = [];
  weekday = [];
  isLoaded;
  modalOpen;
  query = "";
  networkError;

  constructor(
    private translate: TranslateService,
    private keyboard: Keyboard,
    private modalCtrl: ModalController,
    private ws: WebserviceWrapperService
  ) {
    super({ optionalNetwork: true });
  }

  ngOnInit() {
    this.loadOpeningHours();
  }

  loadOpeningHours(refresher?) {
    this.networkError = false;
    this.ws.call("nominatim").subscribe(
      (nominatim) => {
        if (!(refresher && refresher.target)) {
          this.isLoaded = false;
        } else {
          this.query = "";
        }

        this.ws
          .call("openingHours", {}, { forceRefresh: refresher !== undefined })
          .subscribe(
            (response) => {
              this.allOpeningHours = response;

              const from = new Date();
              const to = new Date();
              to.setDate(to.getDate() + 6);
              to.setHours(23, 59, 59, 999);

              for (let i = 0; i < this.allOpeningHours.length; i++) {
                this.allOpeningHours[
                  i
                ].parsedOpening = new opening(
                  this.allOpeningHours[i].opening_hours,
                  nominatim,
                  { locale: this.translate.currentLang }
                );

                this.allOpeningHours[i].nextChange = this.allOpeningHours[
                  i
                ].parsedOpening.getNextChange(from, to);

                this.allOpeningHours[i].state = this.allOpeningHours[
                  i
                ].parsedOpening.getState();
                this.allOpeningHours[i].unknownState = this.allOpeningHours[
                  i
                ].parsedOpening.getUnknown();
              }

              this.openingHours = this.sortOpenings(this.allOpeningHours);
              this.isLoaded = true;

              if (refresher && refresher.target) {
                refresher.target.complete();
              }
            },
            () => {
              this.isLoaded = true;
              if (refresher && refresher.target) {
                refresher.target.complete();
              }
              this.networkError = true;
            }
          );
      },
      () => {
        if (refresher && refresher.target) {
          refresher.target.complete();
        }
        this.isLoaded = true;
        this.networkError = true;
      }
    );
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
    if (
      this.platform.is("cordova") &&
      (this.platform.is("ios") || this.platform.is("android"))
    ) {
      this.keyboard.hide();
    }
  }

  async itemSelected(item) {
    const modal = await this.modalCtrl.create({
      backdropDismiss: false,
      component: DetailedOpeningModalPage,
      componentProps: { item: item },
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
        return (
          this.translate.instant("page.opening-hours.closes") +
          willClose.toLocaleTimeString(this.translate.currentLang, {
            hour: "numeric",
            minute: "numeric",
          }) +
          this.translate.instant("page.opening-hours.time")
        );
      } else {
        return (
          this.translate.instant("page.opening-hours.closes") +
          this.weekday[willClose.getDay()] +
          willClose.toLocaleTimeString(this.translate.currentLang, {
            hour: "numeric",
            minute: "numeric",
          }) +
          this.translate.instant("page.opening-hours.time")
        );
      }
    } else {
      return "";
    }
  }

  closedUntil(index) {
    const willChange: Date = this.openingHours[index].nextChange;

    if (willChange) {
      if (this.isToday(willChange)) {
        return (
          this.translate.instant("page.opening-hours.opens") +
          willChange.toLocaleTimeString(this.translate.currentLang, {
            hour: "numeric",
            minute: "numeric",
          }) +
          this.translate.instant("page.opening-hours.time")
        );
      } else {
        return (
          this.translate.instant("page.opening-hours.opens") +
          this.weekday[willChange.getDay()] +
          willChange.toLocaleTimeString(this.translate.currentLang, {
            hour: "numeric",
            minute: "numeric",
          }) +
          this.translate.instant("page.opening-hours.time")
        );
      }
    } else {
      return "";
    }
  }

  getComment(index) {
    const comment = this.openingHours[index].parsedOpening.getComment();
    if (comment != null) {
      return comment;
    } else {
      return "";
    }
  }

  isToday(td) {
    const d = new Date();
    return (
      td.getDate() === d.getDate() &&
      td.getMonth() === d.getMonth() &&
      td.getFullYear() === d.getFullYear()
    );
  }

  ionViewDidEnter() {
    this.weekday = [];
    if (this.translate.currentLang === "de") {
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
    const val = event.target.value;
    this.openingHours = this.allOpeningHours;

    if (val && val.trim() !== "") {
      this.openingHours = this.openingHours.filter(function (item) {
        if (item && item.name) {
          return item.name.toLowerCase().includes(val.toLowerCase());
        } else {
          return false;
        }
      });
    }
  }
}
