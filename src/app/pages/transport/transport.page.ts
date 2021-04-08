import { Component, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { ICampus, IJourneyResponse } from 'src/app/lib/interfaces';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { CampusTabComponent } from '../../components/campus-tab/campus-tab.component';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';
import { ITransportRequestParams } from '../../services/webservice-wrapper/webservice-definition-interfaces';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-transport',
  templateUrl: './transport.page.html',
  styleUrls: ['./transport.page.scss'],
})
export class TransportPage extends AbstractPage {
  @ViewChild(CampusTabComponent, { static: false })
  campusTabComponent: CampusTabComponent;

  currentDate;
  isLoaded = false;
  hardRefresh = false;
  campus: ICampus;
  departures = [];
  isEnd = false;
  maxJourneys = 15;

  error = null;

  constructor(
    private ws: WebserviceWrapperService,
    public translate: TranslateService // used in template
  ) {
    super({ optionalNetwork: true });
  }

  changeCampus(campus: ICampus) {
    this.campus = campus;
    this.loadTransport();
  }

  loadTransport(refresher?, infiniteScroll?) {
    this.currentDate = moment();
    this.isEnd = false;

    if (refresher) {
      this.hardRefresh = true;
    } else if (!infiniteScroll) {
      this.isLoaded = false;
    }

    if (!infiniteScroll) {
      this.maxJourneys = 15;
    }

    this.error = null;

    this.ws
      .call('transport', {
        time: this.currentDate.format('HH:mm:ss'),
        campus: this.campus,
        maxJourneys: this.maxJourneys.toString(),
      } as ITransportRequestParams)
      .subscribe(
        (res: IJourneyResponse) => {
          if (res && res.Departure && !infiniteScroll) {
            this.departures = res.Departure;
          } else if (res && res.Departure && infiniteScroll) {
            for (const resDep of res.Departure) {
              let found = false;
              for (const dep of this.departures) {
                if (dep.JourneyDetailRef.ref === resDep.JourneyDetailRef.ref) {
                  found = true;
                }
              }

              if (!found) {
                this.departures.push(resDep);
              }
            }
          }

          if (this.maxJourneys > this.departures.length) {
            this.isEnd = true;
          }

          if (refresher && refresher.target) {
            refresher.target.complete();
          }

          this.hardRefresh = false;
          this.isLoaded = true;
          if (infiniteScroll) {
            infiniteScroll.target.complete();
          }
        },
        (error) => {
          if (infiniteScroll) {
            infiniteScroll.target.complete();
          }
          if (refresher && refresher.target) {
            refresher.target.complete();
          }
          this.hardRefresh = false;
          this.isLoaded = true;
          this.error = error;
        }
      );
  }

  doInfinite(infiniteScroll) {
    this.maxJourneys += 10;
    this.loadTransport(false, infiniteScroll);
  }
}
