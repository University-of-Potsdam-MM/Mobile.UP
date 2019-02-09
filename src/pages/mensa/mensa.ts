import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Storage } from "@ionic/storage";
import { IConfig, IMensaResponse, IMeals } from "../../library/interfaces";
import { CalendarComponentOptions } from 'ion2-calendar';
import { CacheService } from 'ionic-cache';
import { ConnectionProvider } from "../../providers/connection/connection";
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

@IonicPage()
@Component({
  selector: 'page-mensa',
  templateUrl: 'mensa.html',
})
export class MensaPage {

  // calendar variables
  showBasicCalendar = false;
  date = moment();
  type: 'moment';
  optionsBasic: CalendarComponentOptions = {
    weekdays: this.getWeekdays(),
    showMonthPicker: false,
    weekStart: 1
  };

  currentDate = moment();
  allMeals: IMeals[] = [];
  ulfMeals: IMeals[] = [];

  mealForDate: boolean[] = [];
  ulfMealForDate: boolean[] = [];

  mealIsExpanded: boolean[] = [];
  ulfMealIsExpanded: boolean[] = [];

  mealIsVegan: boolean[] = [];
  ulfMealIsVegan: boolean[] = [];

  mealIsVegetarian: boolean[] = [];
  ulfMealIsVegetarian: boolean[] = []

  allergenIsExpanded: boolean[][] = [];
  ulfAllergenIsExpanded: boolean[][] = [];

  iconMapping = [];
  ulfIconMapping = [];

  onlyVeganFood = false;
  onlyVeggieFood = false;
  isLoaded = false;
  hardRefresh = false;
  noMealsForDate;
  noUlfMealsForDate;

  campus;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private http: HttpClient,
    private cache: CacheService,
    private connection: ConnectionProvider,
    private translate: TranslateService,
    private swipeEvent: Events,
    private storage: Storage) {
  }

  ionViewDidLoad() {
    this.connection.checkOnline(true, true);
  }

  /**
   * @param query
   */
  public async changeCampus(campus) {
    this.campus = campus;
    this.loadCampusMenu();
  }

  async loadCampusMenu(refresher?) {
    var i;

    if (refresher) {
      this.cache.removeItems("mensaResponse*");
      this.hardRefresh = true;
    } else { this.isLoaded = false; }

    this.allMeals = [];
    this.ulfMeals = undefined;
    for (i = 0; i < this.mealIsExpanded.length; i++) { this.mealIsExpanded[i] = false; }
    for (i = 0; i < this.mealForDate.length; i++) { this.mealForDate[i] = false; }
    for (i = 0; i < this.mealIsVegan.length; i++) { this.mealIsVegan[i] = false; }
    for (i = 0; i < this.mealIsVegetarian.length; i++) { this.mealIsVegetarian[i] = false; }

    for (i = 0; i < this.ulfMealIsExpanded.length; i++) { this.ulfMealIsExpanded[i] = false; }
    for (i = 0; i < this.ulfMealForDate.length; i++) { this.ulfMealForDate[i] = false; }
    for (i = 0; i < this.ulfMealIsVegan.length; i++) { this.ulfMealIsVegan[i] = false; }
    for (i = 0; i < this.ulfMealIsVegetarian.length; i++) { this.ulfMealIsVegetarian[i] = false; }
    this.noMealsForDate = true;
    this.noUlfMealsForDate = true;

    let config:IConfig = await this.storage.get("config");

    let headers: HttpHeaders = new HttpHeaders()
      .append("Authorization", config.webservices.apiToken);

    let params: HttpParams = new HttpParams()
      .append("location", this.campus);

    let request = this.http.get(config.webservices.endpoint.mensa, {headers:headers, params:params});
    this.cache.loadFromObservable("mensaResponse"+this.campus, request).subscribe((res:IMensaResponse) => {

      if (res.meal) {
        this.allMeals = res.meal;
      }

      if (res.iconHashMap && res.iconHashMap.entry) {
        this.iconMapping = res.iconHashMap.entry;
      }

      if (this.campus == "Griebnitzsee") {
        let ulfParam = "UlfsCafe"
        let params: HttpParams = new HttpParams()
          .append("location", ulfParam);

        let request = this.http.get(config.webservices.endpoint.mensa, {headers:headers, params:params});

        this.cache.loadFromObservable("mensaResponse" + ulfParam, request).subscribe((resUlf:IMensaResponse) => {
          if (resUlf.meal) {
            this.ulfMeals = resUlf.meal;
          }

          if (resUlf.iconHashMap && resUlf.iconHashMap.entry) {
            this.ulfIconMapping = resUlf.iconHashMap.entry;
          }

          this.classifyMeals();

          if (refresher) {
            refresher.complete();
          }
        });
      } else {
        this.classifyMeals();

        if (refresher) {
          refresher.complete();
        }
      }

    }, error => {
      console.log(error);
    });
  }

  classifyMeals() {
    var i, mealDate;

    for (i = 0; i < this.allMeals.length; i++) {
      this.allergenIsExpanded[i] = [];
      if (this.allMeals[i].date) {
        mealDate = moment(this.allMeals[i].date);
      } else { mealDate = moment(); }

      if (this.currentDate.format('MM DD YYYY') == mealDate.format('MM DD YYYY')) {
        this.mealForDate[i] = true;
        this.noMealsForDate = false;
      } else { this.mealForDate[i] = false; }

      // check for vegan, vegetarian
      if (this.allMeals[i].type && this.allMeals[i].type.length > 0) {
        switch(this.allMeals[i].type[0]) {
          case "Vegan": {
            this.mealIsVegan[i] = true;
            this.mealIsVegetarian[i] = false;
            break;
          }
          case "Vegetarisch": {
            this.mealIsVegan[i] = false;
            this.mealIsVegetarian[i] = true;
            break;
          }
        }
      }
    }

    if (this.ulfMeals) {
      for (i = 0; i < this.ulfMeals.length; i++) {
        this.ulfAllergenIsExpanded[i] = [];
        if (this.ulfMeals[i].date) {
          mealDate = moment(this.ulfMeals[i].date);
        } else { mealDate = moment(); }

        if (this.currentDate.format('MM DD YYYY') == mealDate.format('MM DD YYYY')) {
          this.ulfMealForDate[i] = true;
          this.noUlfMealsForDate = false;
        } else { this.ulfMealForDate[i] = false; }

        // check for vegan, vegetarian
        if (this.ulfMeals[i].type && this.ulfMeals[i].type.length > 0) {
          switch(this.ulfMeals[i].type[0]) {
            case "Vegan": {
              this.ulfMealIsVegan[i] = true;
              this.ulfMealIsVegetarian[i] = false;
              break;
            }
            case "Vegetarisch": {
              this.ulfMealIsVegan[i] = false;
              this.ulfMealIsVegetarian[i] = true;
              break;
            }
          }
        }
      }
    }

    this.hardRefresh = false;
    this.isLoaded = true;
    this.pickDate(this.date);
  }

  pickDate($event) {
    setTimeout(() => {
      this.showBasicCalendar = false;
    }, 100);

    this.noMealsForDate = true;
    this.noUlfMealsForDate = true;

    var i, mealDate;
    for (i = 0; i < this.allMeals.length; i++) {
      if (this.allMeals[i].date) {
        mealDate = moment(this.allMeals[i].date);
      } else { mealDate = moment(); }

      if ($event.format('MM DD YYYY') == mealDate.format('MM DD YYYY')) {
        this.mealForDate[i] = true;
        this.noMealsForDate = false;
      } else { this.mealForDate[i] = false; }
    }

    if (this.ulfMeals) {
      for (i = 0; i < this.ulfMeals.length; i++) {
        if (this.ulfMeals[i].date) {
          mealDate = moment(this.ulfMeals[i].date);
        } else { mealDate = moment(); }

        if ($event.format('MM DD YYYY') == mealDate.format('MM DD YYYY')) {
          this.ulfMealForDate[i] = true;
          this.noUlfMealsForDate = false;
        } else { this.ulfMealForDate[i] = false; }
      }
    }
  }

  veganOnly() {
    this.onlyVeganFood = !this.onlyVeganFood;
    this.onlyVeggieFood = false;

    this.noMealsForDate = true;
    this.noUlfMealsForDate = true;
    var i;
    for (i = 0; i < this.allMeals.length; i++) {
      if (this.checkConditions(i)) {
        this.noMealsForDate = false;
      }
    }

    if (this.ulfMeals) {
      for (i = 0; i < this.ulfMeals.length; i++) {
        if (this.checkConditions(i, true)) {
          this.noUlfMealsForDate = false;
        }
      }
    }
  }

  vegetarianOnly() {
    this.onlyVeggieFood = !this.onlyVeggieFood;
    this.onlyVeganFood = false;

    this.noMealsForDate = true;
    this.noUlfMealsForDate = true;

    var i;
    for (i = 0; i < this.allMeals.length; i++) {
      if (this.checkConditions(i)) {
        this.noMealsForDate = false;
      }
    }

    if (this.ulfMeals) {
      for (i = 0; i < this.ulfMeals.length; i++) {
        if (this.checkConditions(i, true)) {
          this.noUlfMealsForDate = false;
        }
      }
    }
  }

  checkConditions(i, ulf?) {
    if (!ulf) {
      if (this.mealForDate[i]) {
        if (this.onlyVeganFood) {
          if (this.mealIsVegan[i]) {
            return true;
          } else if (this.onlyVeggieFood) {
            if (this.mealIsVegetarian[i]) {
              return true;
            } else { return false; }
          }
        } else if (this.onlyVeggieFood) {
          if (this.mealIsVegetarian[i] || this.mealIsVegan[i]) {
            return true;
          } else { return false; }
        } else { return true; }
      } else { return false; }
    } else {
      if (this.ulfMealForDate[i]) {
        if (this.onlyVeganFood) {
          if (this.ulfMealIsVegan[i]) {
            return true;
          } else if (this.onlyVeggieFood) {
            if (this.ulfMealIsVegetarian[i]) {
              return true;
            } else { return false; }
          }
        } else if (this.onlyVeggieFood) {
          if (this.ulfMealIsVegetarian[i] || this.ulfMealIsVegan[i]) {
            return true;
          } else { return false; }
        } else { return true; }
      } else { return false; }
    }
  }

  getWeekdays():string[] {
    if (this.translate.currentLang == 'de') {
      return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    } else { return ['S', 'M', 'T', 'W', 'T', 'F', 'S']; }
  }

  swipeCampus(event) {
    if (Math.abs(event.deltaY) < 50) {
      if (event.deltaX > 0) {
        // user swiped from left to right
        this.swipeEvent.publish('campus-swipe-to-right', this.campus);
      } else if (event.deltaX < 0) {
        // user swiped from right to left
        this.swipeEvent.publish('campus-swipe-to-left', this.campus);
      }
    }
  }

}
