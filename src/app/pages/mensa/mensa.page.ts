import { Component, ViewChild } from '@angular/core';
import { CalendarComponentOptions } from 'ion2-calendar';
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

  // calendar variables
  showBasicCalendar = false;
  date = moment();
  type: 'moment';
  optionsBasic: CalendarComponentOptions = {
    weekdays: this.getWeekdays(),
    showMonthPicker: false,
    weekStart: 1
  };

  filterKeywords = [];
  currentDate = moment();

  allMeals: IMeals[] = [];
  displayedMeals: IMeals[] = [];
  ulfMeals: IMeals[] = [];
  displayedUlfMeals: IMeals[] = [];

  mealForDate: boolean[] = [];
  ulfMealForDate: boolean[] = [];

  iconMapping = [];
  ulfIconMapping = [];
  mensaIsOpen = true;

  isLoaded;
  hardRefresh;
  noMealsForDate;
  noUlfMealsForDate;
  campus: ICampus;

  @ViewChild(CampusTabComponent) campusTabComponent: CampusTabComponent;

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
    if (refresher) {
      this.hardRefresh = true;
    } else { this.isLoaded = false; }

    this.getOpening();

    this.allMeals = [];
    this.displayedMeals = [];
    this.ulfMeals = undefined;
    this.displayedUlfMeals = undefined;
    for (let i = 0; i < this.mealForDate.length; i++) { this.mealForDate[i] = false; }
    for (let i = 0; i < this.ulfMealForDate.length; i++) { this.ulfMealForDate[i] = false; }

    this.noMealsForDate = true;
    this.noUlfMealsForDate = true;

    this.ws.call(
      'mensa',
      <IMensaRequestParams>{
        campus_canteen_name: this.campus.canteen_name
      },
      { forceRefreshGroup: this.hardRefresh }
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
          if (refresher) { refresher.target.complete(); }
        }, error => console.log(error));
      } else {
        this.getFilterKeywords();
        this.classifyMeals();
        if (refresher) { refresher.target.complete(); }
      }
    }, error => {
      console.log(error);
      this.isLoaded = true;
      this.hardRefresh = false;
      if (refresher) { refresher.target.complete(); }
    });
  }

  getFilterKeywords() {
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

    this.hardRefresh = false;
    this.isLoaded = true;
    this.pickDate(this.date);
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
    setTimeout(() => {
      this.showBasicCalendar = false;
    }, 100);

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

  getWeekdays(): string[] {
    if (this.translate.currentLang === 'de') {
      return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    } else { return ['S', 'M', 'T', 'W', 'T', 'F', 'S']; }
  }

  getOpening() {
    this.mensaIsOpen = true;
    const searchTerm = 'mensa ' + this.campus.name.replace('neuespalais', 'am neuen palais');

    this.ws.call('openingHours').subscribe(response => {
      this.ws.call('nominatim').subscribe(nominatim => {
        if (response) {
          response = utils.convertToArray(response);
          response = response.filter(function(item) {
            return item.name.toLowerCase().includes(searchTerm.toLowerCase());
          });

          if (response.length > 0) {
            response = response[0];
            response.parsedOpening = new opening(
              response.opening_hours,
              nominatim,
              { 'locale': this.translate.currentLang });
            this.mensaIsOpen = response.parsedOpening.getState();
          }
        }
      }, error => console.log(error));
    }, error => console.log(error));
  }
}
