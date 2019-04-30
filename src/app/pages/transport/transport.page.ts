import {Component, ViewChild} from '@angular/core';
import { HttpParams, HttpHeaders, HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { Events } from '@ionic/angular';
import {ICampus, IJourneyResponse} from 'src/app/lib/interfaces';
import { AbstractPage } from 'src/app/lib/abstract-page';
import {CampusTabComponent} from '../../components/campus-tab/campus-tab.component';
import {WebserviceWrapperService} from '../../services/webservice-wrapper/webservice-wrapper.service';
import {ITransportRequestParams} from '../../services/webservice-wrapper/webservice-definition-interfaces';

@Component({
  selector: 'app-transport',
  templateUrl: './transport.page.html',
  styleUrls: ['./transport.page.scss'],
})
export class TransportPage extends AbstractPage {

  currentDate;
  isLoaded = false;
  hardRefresh = false;
  campus: ICampus;
  campusid;
  departures = [];
  isEnd = false;
  maxJourneys = 15;

  error = null;

  @ViewChild(CampusTabComponent) campusTabComponent: CampusTabComponent;

  constructor(
    private ws: WebserviceWrapperService
  ) {
    super({ requireNetwork: true });
  }

  changeCampus(campus: ICampus) {
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

    this.error = null;

    this.ws.call(
      'transport',
      <ITransportRequestParams>{
        time: this.currentDate.format('HH:mm:ss'),
        campus: this.campus,
        maxJourneys: this.maxJourneys.toString()
      }
    ).subscribe((res: IJourneyResponse) => {

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
        this.campusTabComponent.selectPreviousCampus();
      } else if (event.deltaX < 0) {
        // user swiped from right to left
        this.campusTabComponent.selectNextCampus();
      }
    }
  }

}
