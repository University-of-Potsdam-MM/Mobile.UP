import { Component, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { ICampus, IMeals, IMensaResponse } from 'src/app/lib/interfaces';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';
import { IMensaRequestParams } from '../../services/webservice-wrapper/webservice-definition-interfaces';
import { CampusTabComponent } from '../../components/campus-tab/campus-tab.component';
import { utils } from '../../lib/util';
import * as jquery from 'jquery';
import * as opening from 'opening_hours';


@Component({
  selector: 'app-mensa',
  templateUrl: './mensa.page.html',
  styleUrls: ['./mensa.page.scss'],
})
export class MensaPage extends AbstractPage {

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

  @ViewChild(CampusTabComponent, { static: false }) campusTabComponent: CampusTabComponent;

  constructor(
    private translate: TranslateService,
    private ws: WebserviceWrapperService
  ) {
    super({ optionalNetwork: true });
  }

  /**
   * switches the currently selected campus
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
    for (let i = 0; i < this.mealForDate.length; i++) { this.mealForDate[i] = false; }
    for (let i = 0; i < this.ulfMealForDate.length; i++) { this.ulfMealForDate[i] = false; }

    this.noMealsForDate = true;
    this.noUlfMealsForDate = true;
    this.networkError = false;

    if (this.campus.canteen_name && this.campus.canteen_name.length > 0) {
      this.noMensaForLocation = false;
      this.ws.call(
        'mensa',
        <IMensaRequestParams>{
          campus_canteen_name: this.campus.canteen_name
        },
        { forceRefreshGroup: refresher !== undefined }
      ).subscribe((res: IMensaResponse) => {
        if (res.meal) {
          this.allMeals = res.meal;
          this.displayedMeals = res.meal;
        }
        if (res.iconHashMap && res.iconHashMap.entry) { this.iconMapping = res.iconHashMap.entry; }

        if (this.campus.canteen_name === 'Griebnitzsee') {
          const ulfParam = 'UlfsCafe';
          this.ws.call(
            'mensa',
            <IMensaRequestParams>{
              campus_canteen_name: ulfParam
            }
          ).subscribe((resUlf: IMensaResponse) => {
            if (resUlf.meal) {
              this.ulfMeals = resUlf.meal;
              this.displayedUlfMeals = resUlf.meal;
            }
            if (resUlf.iconHashMap && resUlf.iconHashMap.entry) { this.ulfIconMapping = resUlf.iconHashMap.entry; }
            this.getFilterKeywords();
            this.classifyMeals();
            if (refresher && refresher.target) { refresher.target.complete(); }
          });
        } else {
          this.getFilterKeywords();
          this.classifyMeals();
          if (refresher && refresher.target) { refresher.target.complete(); }
        }
      }, () => {
        this.isLoaded = true;
        this.networkError = true;
        if (refresher && refresher.target) { refresher.target.complete(); }
      });
    } else {
      this.noMensaForLocation = true;
      if (refresher && refresher.target) { refresher.target.complete(); }
      this.isLoaded = true;
    }
  }

  getFilterKeywords() {
    this.filterKeywords = [];
    for (let i = 0; i < this.displayedMeals.length; i++) {
      for (let j = 0; j < this.displayedMeals[i].type.length; j++) {
        if (!utils.isInArray(this.filterKeywords, this.displayedMeals[i].type[j])) {
          this.filterKeywords.push(this.displayedMeals[i].type[j]);
        }
      }
      this.filterKeywords.sort();
    }
  }

  classifyMeals() {
    let mealDate;
    for (let i = 0; i < this.displayedMeals.length; i++) {
      if (this.displayedMeals[i].date) {
        mealDate = moment(this.displayedMeals[i].date);
      } else { mealDate = moment(); }

      if (this.currentDate.format('MM DD YYYY') === mealDate.format('MM DD YYYY')) {
        this.mealForDate[i] = true;
        this.noMealsForDate = false;
      } else { this.mealForDate[i] = false; }
    }

    if (this.displayedUlfMeals) {
      for (let i = 0; i < this.displayedUlfMeals.length; i++) {
        if (this.displayedUlfMeals[i].date) {
          mealDate = moment(this.displayedUlfMeals[i].date);
        } else { mealDate = moment(); }

        if (this.currentDate.format('MM DD YYYY') === mealDate.format('MM DD YYYY')) {
          this.ulfMealForDate[i] = true;
          this.noUlfMealsForDate = false;
        } else { this.ulfMealForDate[i] = false; }
      }
    }

    this.isLoaded = true;
    this.pickDate(this.selectedDate);
  }

  filterMenus(event) {
    const filter = utils.convertToArray(event.detail.value);

    this.displayedMeals = this.allMeals;
    this.displayedUlfMeals = this.ulfMeals;

    if (filter && filter.length > 0) {
      this.displayedMeals = jquery.grep(this.displayedMeals, (meal) => {
        if (meal.type) {
          let fulfillsConditions = false;
          for (let i = 0; i < filter.length; i++) {
            if (utils.isInArray(meal.type, filter[i])) {
              fulfillsConditions = true;
              break;
            }
          }
          return fulfillsConditions;
        } else { return false; }
      });

      if (this.displayedUlfMeals) {
        this.displayedUlfMeals = jquery.grep(this.displayedUlfMeals, (meal) => {
          if (meal.type) {
            let fulfillsConditions = false;
            for (let i = 0; i < filter.length; i++) {
              if (utils.isInArray(meal.type, filter[i])) {
                fulfillsConditions = true;
                break;
              }
            }
            return fulfillsConditions;
          } else { return false; }
        });
      }
    }

    this.classifyMeals();
  }

  pickDate($event) {
    this.selectedDate = $event;
    this.noMealsForDate = true;
    this.noUlfMealsForDate = true;

    let i, mealDate;
    for (i = 0; i < this.displayedMeals.length; i++) {
      if (this.displayedMeals[i].date) {
        mealDate = moment(this.displayedMeals[i].date);
      } else { mealDate = moment(); }

      if ($event.format('MM DD YYYY') === mealDate.format('MM DD YYYY')) {
        this.mealForDate[i] = true;
        this.noMealsForDate = false;
      } else { this.mealForDate[i] = false; }
    }

    if (this.displayedUlfMeals) {
      for (i = 0; i < this.displayedUlfMeals.length; i++) {
        if (this.displayedUlfMeals[i].date) {
          mealDate = moment(this.displayedUlfMeals[i].date);
        } else { mealDate = moment(); }

        if ($event.format('MM DD YYYY') === mealDate.format('MM DD YYYY')) {
          this.ulfMealForDate[i] = true;
          this.noUlfMealsForDate = false;
        } else { this.ulfMealForDate[i] = false; }
      }
    }
  }

  getOpening(refresher?) {
    this.mensaIsOpen = true;
    this.foodhopperIsOpen = false;
    const searchTerm = 'mensa ' + this.campus.name.replace('neuespalais', 'am neuen palais');

    this.ws.call('openingHours', {}, { forceRefresh: refresher !== undefined }).subscribe((response: any) => {
      this.ws.call('nominatim').subscribe(nominatim => {
        if (response) {
          response = utils.convertToArray(response);
          var mensaOpening = response.filter(function(item) {
            if (item && item.name) {
              return item.name.toLowerCase().includes(searchTerm.toLowerCase());
            } else { return false; }
          });

          if (mensaOpening && mensaOpening.length > 0) {
            mensaOpening = mensaOpening[0];
            mensaOpening.parsedOpening = new opening(
              mensaOpening.opening_hours,
              nominatim,
              { 'locale': this.translate.currentLang });
            this.mensaIsOpen = mensaOpening.parsedOpening.getState();
          }

          if (this.campus.canteen_name === 'Griebnitzsee') {
            const searchTermFoodhopper = 'foodhopper stahnsdorfer straße';

            var foodhopperOpening = response.filter(function(item) {
              if (item && item.name) {
                return item.name.toLowerCase().includes(searchTermFoodhopper.toLowerCase());
              } else { return false; }
            });

            if (foodhopperOpening && foodhopperOpening.length > 0) {
              foodhopperOpening = foodhopperOpening[0];
              foodhopperOpening.parsedOpening = new opening(
                foodhopperOpening.opening_hours,
                nominatim,
                { 'locale': this.translate.currentLang });
              this.foodhopperIsOpen = foodhopperOpening.parsedOpening.getState();
            }
          }
        }
      });
    });
  }

}
