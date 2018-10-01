import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Storage } from "@ionic/storage";
import {
  IConfig,
  IMensaResponse,
  IMeals
} from "../../library/interfaces";


@IonicPage()
@Component({
  selector: 'page-mensa',
  templateUrl: 'mensa.html',
})
export class MensaPage {

  currentCampus: string = '';
  currentDate: Date;
  isLoaded = false;
  allMeals: IMeals[] = [];

  mealForToday: boolean[] = [];
  mealIsExpanded: boolean[] = [];
  mealIsFish: boolean[] = [];
  mealIsVegan: boolean[] = [];
  mealIsVegetarian: boolean[] = [];
  allergenIsExpanded: boolean[][] = [];

  fishIconSource:string = "https://xml.stw-potsdam.de/images/icons/su_fisch_f.png";
  veganIconSource:string = "https://xml.stw-potsdam.de/images/icons/su_vegan_w.png";
  vegetarianIconSource:string = "https://xml.stw-potsdam.de/images/icons/su_vegetarisch_v.png";

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private http: HttpClient,
    private storage: Storage) 
  {
    this.currentDate = new Date();
    this.isLoaded = false;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MensaPage');
  }

  ngOnInit() {
    this.currentCampus = "Griebnitzsee";
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
    for (i = 0; i < this.mealForToday.length; i++) { this.mealForToday[i] = false; }
    for (i = 0; i < this.mealIsFish.length; i++) { this.mealIsFish[i] = false; }
    for (i = 0; i < this.mealIsVegan.length; i++) { this.mealIsVegan[i] = false; }
    for (i = 0; i < this.mealIsVegetarian.length; i++) { this.mealIsVegetarian[i] = false; }

    let config:IConfig = await this.storage.get("config");

    let headers: HttpHeaders = new HttpHeaders()
      .append("Authorization", config.webservices.apiToken);

    let params: HttpParams = new HttpParams()
      .append("location", this.currentCampus);

    this.http.get(config.webservices.endpoint.mensa, {headers:headers, params:params}).subscribe((res:IMensaResponse) => {

      if (res.meal) {
        this.allMeals = res.meal;
        var i;

        // for (i = 0; i < res.iconHashMap.entry.length; i++) {
        //   switch(res.iconHashMap.entry[i].key) {
        //     case "Fisch": {
        //       this.fishIconSource = res.iconHashMap.entry[i].value;
        //     }
        //     case "Vegan": {
        //       this.veganIconSource = res.iconHashMap.entry[i].value;
        //     }
        //     case "Vegetarian": {
        //       this.vegetarianIconSource = res.iconHashMap.entry[i].value;
        //     }
        //   }
        // }

        for (i = 0; i < this.allMeals.length; i++) {
          this.allergenIsExpanded[i] = []
          var mealDate: Date = new Date(this.allMeals[i].date);
          if (this.currentDate.toDateString() == mealDate.toDateString()) {
            this.mealForToday[i] = true;
          } else { this.mealForToday[i] = false; }

          // check for fish, vegan, vegetarian
          if (this.allMeals[i].type.length > 0) {
            switch(this.allMeals[i].type[0]) {
              case "Fisch": {
                this.mealIsFish[i] = true;
                this.mealIsVegan[i] = false;
                this.mealIsVegetarian[i] = false;
              }
              case "Vegan": {
                this.mealIsFish[i] = false;
                this.mealIsVegan[i] = true;
                this.mealIsVegetarian[i] = false;
              }
              case "Vegetarisch": {
                this.mealIsFish[i] = false;
                this.mealIsVegan[i] = false;
                this.mealIsVegetarian[i] = true;
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

}
