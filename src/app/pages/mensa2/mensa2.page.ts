import { Component, OnInit } from '@angular/core';
import { AbstractPage } from '../../lib/abstract-page';
import { ICampus, IMeals, IMensaResponse } from '../../lib/interfaces';
import { default as moment } from 'moment/moment';
import { convertToArray, isInArray } from '../../lib/util';
import jquery from 'jquery';
import { IMensaRequestParams } from '../../services/webservice-wrapper/webservice-definition-interfaces';
import { TranslateService } from '@ngx-translate/core';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';

@Component({
  selector: 'app-mensa2',
  templateUrl: './mensa2.page.html',
  styleUrls: ['./mensa2.page.scss'],
})
export class Mensa2Page extends AbstractPage implements OnInit {
  isLoaded;
  networkError;
  selectedDate;
  currentDate = moment();
  filterKeywords = [];

  ulfMeals: IMeals[] = [];
  displayedUlfMeals: IMeals[] = [];
  ulfMealForDate: boolean[] = [];
  ulfIconMapping = [];
  noUlfMealsForDate;
  campus: ICampus;

  constructor(
    private translate: TranslateService,
    private ws: WebserviceWrapperService
  ) {
    super({ optionalNetwork: true });
  }

  ngOnInit() {
    this.loadMenu(false);
  }

  loadMenu(refresher?) {
    console.log('loadMenu');

    if (!(refresher && refresher.target)) {
      this.isLoaded = false;
    }

    this.ulfMeals = undefined;
    this.displayedUlfMeals = undefined;
    for (let i = 0; i < this.ulfMealForDate.length; i++) {
      this.ulfMealForDate[i] = false;
    }

    this.noUlfMealsForDate = true;
    this.networkError = false;

    this.ws
      .call(
        'mensa',
        {
          campus_canteen_name: 'Griebnitzsee',
        } as IMensaRequestParams,
        { forceRefreshGroup: refresher !== undefined }
      )
      .subscribe(
        (res: IMensaResponse) => {
          res.meal = res.meal.sort((a, b) => {
            if (a.title === 'Info') {
              return -1;
            } else {
              return 0;
            }
          });
          const ulfParam = 'UlfsCafe';
          this.ws
            .call('mensa', {
              campus_canteen_name: ulfParam,
            } as IMensaRequestParams)
            .subscribe((resUlf: IMensaResponse) => {
              console.log(JSON.stringify(resUlf));

              if (resUlf.meal) {
                this.ulfMeals = resUlf.meal;
                this.displayedUlfMeals = resUlf.meal;
              }
              if (resUlf.iconHashMap && resUlf.iconHashMap.entry) {
                this.ulfIconMapping = resUlf.iconHashMap.entry;
              }
              if (refresher && refresher.target) {
                refresher.target.complete();
              }
              this.isLoaded = true;
              this.networkError = false;
              if (refresher && refresher.target) {
                refresher.target.complete();
              }
            });
        },
        () => {
          this.isLoaded = true;
          this.networkError = true;
          if (refresher && refresher.target) {
            refresher.target.complete();
          }
        }
      );
  }

  pickDate($event) {
    this.selectedDate = $event;
    this.noUlfMealsForDate = true;

    let i;
    let mealDate;

    if (this.displayedUlfMeals) {
      for (i = 0; i < this.displayedUlfMeals.length; i++) {
        if (this.displayedUlfMeals[i].date) {
          mealDate = moment(this.displayedUlfMeals[i].date);
        } else {
          mealDate = moment();
        }

        if ($event.format('MM DD YYYY') === mealDate.format('MM DD YYYY')) {
          this.ulfMealForDate[i] = true;
          this.noUlfMealsForDate = false;
        } else {
          this.ulfMealForDate[i] = false;
        }
      }
    }
  }

  filterMenus(event) {
    const filter = convertToArray(event.detail.value);

    this.displayedUlfMeals = this.ulfMeals;

    if (filter && filter.length > 0) {
      if (this.displayedUlfMeals) {
        this.displayedUlfMeals = jquery.grep(this.displayedUlfMeals, (meal) => {
          if (meal.type) {
            let fulfillsConditions = false;
            for (const flt of filter) {
              if (isInArray(meal.type, flt)) {
                fulfillsConditions = true;
                break;
              }
            }
            return fulfillsConditions;
          } else {
            return false;
          }
        });
      }
    }

    this.classifyMeals();
  }

  classifyMeals() {
    let mealDate;

    if (this.displayedUlfMeals) {
      for (let i = 0; i < this.displayedUlfMeals.length; i++) {
        if (this.displayedUlfMeals[i].date) {
          mealDate = moment(this.displayedUlfMeals[i].date);
        } else {
          mealDate = moment();
        }

        if (
          this.currentDate.format('MM DD YYYY') ===
          mealDate.format('MM DD YYYY')
        ) {
          this.ulfMealForDate[i] = true;
          this.noUlfMealsForDate = false;
        } else {
          this.ulfMealForDate[i] = false;
        }
      }
    }

    this.isLoaded = true;
    this.pickDate(this.selectedDate);
  }
}
