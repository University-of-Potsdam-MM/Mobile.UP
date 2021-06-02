import { Component, ViewChild } from '@angular/core';
import { default as moment } from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { ICampus, IMeals, IMensaResponse } from 'src/app/lib/interfaces';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';
import { IMensaRequestParams } from '../../services/webservice-wrapper/webservice-definition-interfaces';
import { CampusTabComponent } from '../../components/campus-tab/campus-tab.component';
import * as jquery from 'jquery';
import * as opening from 'opening_hours';
import { convertToArray, isInArray } from 'src/app/lib/util';

@Component({
  selector: 'app-mensa',
  templateUrl: './mensa.page.html',
  styleUrls: ['./mensa.page.scss'],
})
export class MensaPage extends AbstractPage {
  @ViewChild(CampusTabComponent, { static: false })
  campusTabComponent: CampusTabComponent;

  filterKeywords = [];
  currentDate = moment();
  selectedDate = moment();

  allMeals: IMeals[] = [];
  displayedMeals: IMeals[] = [];
  ulfMeals: IMeals[] = [];
  displayedUlfMeals: IMeals[] = [];

  mealForDate: boolean[] = [];
  ulfMealForDate: boolean[] = [];

  iconMapping = [];
  ulfIconMapping = [];
  mensaIsOpen = true;
  foodhopperIsOpen = false;

  isLoaded;
  noMealsForDate;
  noUlfMealsForDate;
  networkError;
  campus: ICampus;
  noMensaForLocation = false;

  constructor(
    private translate: TranslateService,
    private ws: WebserviceWrapperService
  ) {
    super({ optionalNetwork: true });
  }

  /**
   * switches the currently selected campus
   *
   * @param campus {ICampus}
   */
  changeCampus(campus: ICampus) {
    this.campus = campus;
    this.loadCampusMenu();
  }

  loadCampusMenu(refresher?) {
    if (!(refresher && refresher.target)) {
      this.isLoaded = false;
    }

    this.getOpening(refresher);

    this.allMeals = [];
    this.displayedMeals = [];
    this.ulfMeals = undefined;
    this.displayedUlfMeals = undefined;
    for (let i = 0; i < this.mealForDate.length; i++) {
      this.mealForDate[i] = false;
    }
    for (let i = 0; i < this.ulfMealForDate.length; i++) {
      this.ulfMealForDate[i] = false;
    }

    this.noMealsForDate = true;
    this.noUlfMealsForDate = true;
    this.networkError = false;

    if (this.campus.canteen_name && this.campus.canteen_name.length > 0) {
      this.noMensaForLocation = false;
      this.ws
        .call(
          'mensa',
          {
            campus_canteen_name: this.campus.canteen_name,
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
            if (res.meal) {
              this.allMeals = res.meal;
              this.displayedMeals = res.meal;
            }
            if (res.iconHashMap && res.iconHashMap.entry) {
              this.iconMapping = res.iconHashMap.entry;
            }

            if (this.campus.canteen_name === 'Griebnitzsee') {
              const ulfParam = 'UlfsCafe';
              this.ws
                .call('mensa', {
                  campus_canteen_name: ulfParam,
                } as IMensaRequestParams)
                .subscribe((resUlf: IMensaResponse) => {
                  if (resUlf.meal) {
                    this.ulfMeals = resUlf.meal;
                    this.displayedUlfMeals = resUlf.meal;
                  }
                  if (resUlf.iconHashMap && resUlf.iconHashMap.entry) {
                    this.ulfIconMapping = resUlf.iconHashMap.entry;
                  }
                  this.getFilterKeywords();
                  this.classifyMeals();
                  if (refresher && refresher.target) {
                    refresher.target.complete();
                  }
                });
            } else {
              this.getFilterKeywords();
              this.classifyMeals();
              if (refresher && refresher.target) {
                refresher.target.complete();
              }
            }
          },
          () => {
            this.isLoaded = true;
            this.networkError = true;
            if (refresher && refresher.target) {
              refresher.target.complete();
            }
          }
        );
    } else {
      this.noMensaForLocation = true;
      if (refresher && refresher.target) {
        refresher.target.complete();
      }
      this.isLoaded = true;
    }
  }

  getFilterKeywords() {
    this.filterKeywords = [];
    for (const [index, meal] of this.displayedMeals.entries()) {
      if (this.mealForDate[index]) {
        for (const mealType of meal.type) {
          if (!isInArray(this.filterKeywords, mealType)) {
            this.filterKeywords.push(mealType);
          }
        }
      }
    }
    this.filterKeywords.sort();
  }

  classifyMeals() {
    let mealDate;
    for (let i = 0; i < this.displayedMeals.length; i++) {
      if (this.displayedMeals[i].date) {
        mealDate = moment(this.displayedMeals[i].date);
      } else {
        mealDate = moment();
      }

      if (
        this.currentDate.format('MM DD YYYY') === mealDate.format('MM DD YYYY')
      ) {
        this.mealForDate[i] = true;
        this.noMealsForDate = false;
      } else {
        this.mealForDate[i] = false;
      }
    }

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

  filterMenus(event) {
    const filter = convertToArray(event.detail.value);

    this.displayedMeals = this.allMeals;
    this.displayedUlfMeals = this.ulfMeals;

    if (filter && filter.length > 0) {
      this.displayedMeals = jquery.grep(this.displayedMeals, (meal) => {
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

  pickDate($event) {
    this.selectedDate = $event;
    this.noMealsForDate = true;
    this.noUlfMealsForDate = true;

    let i;
    let mealDate;
    for (i = 0; i < this.displayedMeals.length; i++) {
      if (this.displayedMeals[i].date) {
        mealDate = moment(this.displayedMeals[i].date);
      } else {
        mealDate = moment();
      }

      if ($event.format('MM DD YYYY') === mealDate.format('MM DD YYYY')) {
        this.mealForDate[i] = true;
        this.noMealsForDate = false;
      } else {
        this.mealForDate[i] = false;
      }
    }

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

    this.getFilterKeywords();
  }

  getOpening(refresher?) {
    this.mensaIsOpen = true;
    this.foodhopperIsOpen = false;
    const searchTerm =
      'mensa ' + this.campus.name.replace('neuespalais', 'am neuen palais');

    this.ws
      .call('openingHours', {}, { forceRefresh: refresher !== undefined })
      .subscribe((response: any) => {
        this.ws.call('nominatim').subscribe((nominatim) => {
          if (response) {
            response = convertToArray(response);
            let mensaOpening = response.filter(function (item) {
              if (item && item.name) {
                return item.name
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase());
              } else {
                return false;
              }
            });

            if (mensaOpening && mensaOpening.length > 0) {
              mensaOpening = mensaOpening[0];
              mensaOpening.parsedOpening = new opening(
                mensaOpening.opening_hours,
                nominatim,
                { locale: this.translate.currentLang }
              );
              this.mensaIsOpen = mensaOpening.parsedOpening.getState();
            }

            if (this.campus.canteen_name === 'Griebnitzsee') {
              const searchTermFoodhopper = 'foodhopper stahnsdorfer straße';

              let foodhopperOpening = response.filter(function (item) {
                if (item && item.name) {
                  return item.name
                    .toLowerCase()
                    .includes(searchTermFoodhopper.toLowerCase());
                } else {
                  return false;
                }
              });

              if (foodhopperOpening && foodhopperOpening.length > 0) {
                foodhopperOpening = foodhopperOpening[0];
                foodhopperOpening.parsedOpening = new opening(
                  foodhopperOpening.opening_hours,
                  nominatim,
                  { locale: this.translate.currentLang }
                );
                this.foodhopperIsOpen =
                  foodhopperOpening.parsedOpening.getState();
              }
            }
          }
        });
      });
  }
}
