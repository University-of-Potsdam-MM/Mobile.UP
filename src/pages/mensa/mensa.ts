import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Storage } from "@ionic/storage";
import {
  IConfig,
  IMensaResponse,
  IMeals
} from "../../library/interfaces";
import { CalendarComponentOptions } from 'ion2-calendar';
import { SettingsProvider } from "../../providers/settings/settings";


@IonicPage()
@Component({
  selector: 'page-mensa',
  templateUrl: 'mensa.html',
})
export class MensaPage {

  // calendar variables
  showBasicCalendar = false;
  date: string;
  type: 'moment';
  optionsBasic: CalendarComponentOptions = {
    monthPickerFormat: ['JAN', 'FEB', 'MÄR', 'APR', 'MAI', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEZ']
  };

  currentCampus: string = '';
  currentDate: Date;
  isLoaded = false;
  allMeals: IMeals[] = [];

  mealForDate: boolean[] = [];
  mealIsExpanded: boolean[] = [];
  mealIsFish: boolean[] = [];
  mealIsVegan: boolean[] = [];
  mealIsVegetarian: boolean[] = [];
  allergenIsExpanded: boolean[][] = [];
  noMealsForDate: boolean = true;

  onlyVeganFood = false;
  onlyVeggieFood = false;

  fishIconSource:string;
  veganIconSource:string;
  vegetarianIconSource:string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private http: HttpClient,
    private settingsProvider: SettingsProvider,
    private storage: Storage) 
  {
    this.currentDate = new Date();
    this.isLoaded = false;
  }

  ngOnInit() {
    this.initCampus();
  }

  async initCampus() {
    this.currentCampus = await this.settingsProvider.getSettingValue("campus");
    this.currentCampus = this.currentCampus.replace(" ","");
    this.changeCampus();
  }

  /**
   * checks whether a session is stored in memory. If not the user is taken to
   * the LoginPage. If yes a query is sent to the API and the results are placed
   * in this.personsFound so the view can render them
   * @param query
   */
  public async changeCampus() {

    var i;
    this.isLoaded = false;

    this.allMeals = [];
    for (i = 0; i < this.mealIsExpanded.length; i++) { this.mealIsExpanded[i] = false; }
    for (i = 0; i < this.mealForDate.length; i++) { this.mealForDate[i] = false; }
    for (i = 0; i < this.mealIsFish.length; i++) { this.mealIsFish[i] = false; }
    for (i = 0; i < this.mealIsVegan.length; i++) { this.mealIsVegan[i] = false; }
    for (i = 0; i < this.mealIsVegetarian.length; i++) { this.mealIsVegetarian[i] = false; }
    this.noMealsForDate = true;

    let config:IConfig = await this.storage.get("config");

    let headers: HttpHeaders = new HttpHeaders()
      .append("Authorization", config.webservices.apiToken);

    let params: HttpParams = new HttpParams()
      .append("location", this.currentCampus);

    this.http.get(config.webservices.endpoint.mensa, {headers:headers, params:params}).subscribe((res:IMensaResponse) => {

      if (res.meal) {
        this.allMeals = res.meal;
        var i;

        for (i = 0; i < res.iconHashMap.entry.length; i++) {
          switch(res.iconHashMap.entry[i].key) {
            case "Fisch": {
              this.fishIconSource = res.iconHashMap.entry[i].value;
            }
            case "Vegan": {
              this.veganIconSource = res.iconHashMap.entry[i].value;
            }
            case "Vegetarian": {
              this.vegetarianIconSource = res.iconHashMap.entry[i].value;
            }
          }
        }

        for (i = 0; i < this.allMeals.length; i++) {
          this.allergenIsExpanded[i] = []
          var mealDate: Date = new Date(this.allMeals[i].date);
          if (this.currentDate.toDateString() == mealDate.toDateString()) {
            this.mealForDate[i] = true;
            this.noMealsForDate = false;
          } else { this.mealForDate[i] = false; }

          // check for fish, vegan, vegetarian
          if (this.allMeals[i].type.length > 0) {
            switch(this.allMeals[i].type[0]) {
              case "Fisch": {
                this.mealIsFish[i] = true;
                this.mealIsVegan[i] = false;
                this.mealIsVegetarian[i] = false;
                break;
              }
              case "Vegan": {
                this.mealIsFish[i] = false;
                this.mealIsVegan[i] = true;
                this.mealIsVegetarian[i] = false;
                break;
              }
              case "Vegetarisch": {
                this.mealIsFish[i] = false;
                this.mealIsVegan[i] = false;
                this.mealIsVegetarian[i] = true;
                break;
              }
            }
          }
        }
      }
      this.isLoaded = true;
    }, error => {
      console.log(error);
    });
  }

  expandMeal(i) {
    var j,k;
    if (this.mealIsExpanded[i]) {
      this.mealIsExpanded[i] = false;
      for (k = 0; k < this.allMeals[i].allergens.length; k++) {
        this.allergenIsExpanded[i][k] = false;
      }
    } else {
      for (j = 0; j < this.allMeals.length; j++) {
        this.mealIsExpanded[j] = false;
        for (k = 0; k < this.allMeals[j].allergens.length; k++) {
          this.allergenIsExpanded[j][k] = false;
        }
      }
      this.mealIsExpanded[i] = true;
    }
  }

  expandAllergen(i,j) {
    console.log(i,j);
    var k;
    if (this.allergenIsExpanded[i][j]) {
      this.allergenIsExpanded[i][j] = false;
    } else {
      for (k = 0; k < this.allMeals[i].allergens.length; k++) {
        this.allergenIsExpanded[i][k] = false;
      }
      this.allergenIsExpanded[i][j] = true;
    }
  }

  formatPrices(number:number) {
    return number.toFixed(2) + " €";
  }

  pickDate($event) {
    let delay = setTimeout(() => {
      this.showBasicCalendar = false;
    }, 100);
    console.log(delay);

    this.noMealsForDate = true;

    var i;
    for (i = 0; i < this.allMeals.length; i++) {
      var mealDate: Date = new Date(this.allMeals[i].date);
      if ($event.format('ddd MMM DD YYYY') == mealDate.toDateString()) {
        this.mealForDate[i] = true;
        this.noMealsForDate = false;
      } else { this.mealForDate[i] = false; }
    }
  }

  veganOnly() {
    this.onlyVeganFood = !this.onlyVeganFood;
    this.onlyVeggieFood = false;
    
    this.noMealsForDate = true;
    var i;
    for (i = 0; i < this.allMeals.length; i++) {
      if (this.checkConditions(i)) {
        this.noMealsForDate = false;
      }
    }
  }

  vegetarianOnly() {
    this.onlyVeggieFood = !this.onlyVeggieFood;
    this.onlyVeganFood = this.onlyVeggieFood;

    this.noMealsForDate = true;
    var i;
    for (i = 0; i < this.allMeals.length; i++) {
      if (this.checkConditions(i)) {
        this.noMealsForDate = false;
      }
    }
  }

  checkConditions(i) {
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
  }

}
