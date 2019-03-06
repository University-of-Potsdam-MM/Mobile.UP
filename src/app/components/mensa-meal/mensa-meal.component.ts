import { Component, OnInit, Input } from '@angular/core';
import { IMeals } from 'src/app/lib/interfaces';

@Component({
  selector: 'app-mensa-meal',
  templateUrl: './mensa-meal.component.html',
  styleUrls: ['./mensa-meal.component.scss']
})
export class MensaMealComponent implements OnInit {

  @Input() meals: IMeals[];
  @Input() mealForDate: boolean[];
  @Input() onlyVeganFood: boolean;
  @Input() onlyVeggieFood: boolean;
  @Input() mealIsVegan: boolean[];
  @Input() mealIsVegetarian: boolean[];
  @Input() mealIsExpanded: boolean[];
  @Input() allergenIsExpanded: boolean[][];
  @Input() iconMapping;

  constructor() { }

  ngOnInit() {
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

  expandMeal(i) {
    if (this.mealIsExpanded[i]) {
      this.mealIsExpanded[i] = false;
      if (this.meals[i].allergens) {
        for (let k = 0; k < this.meals[i].allergens.length; k++) {
          this.allergenIsExpanded[i][k] = false;
        }
      }
    } else {
      for (let j = 0; j < this.meals.length; j++) {
        this.mealIsExpanded[j] = false;
        if (this.meals[j].allergens) {
          for (let k = 0; k < this.meals[j].allergens.length; k++) {
            this.allergenIsExpanded[j][k] = false;
          }
        }
      }
      this.mealIsExpanded[i] = true;
    }
  }

  expandAllergen(i, j) {
    if (this.allergenIsExpanded[i][j]) {
      this.allergenIsExpanded[i][j] = false;
    } else {
      if (this.meals[i].allergens) {
        for (let k = 0; k < this.meals[i].allergens.length; k++) {
          this.allergenIsExpanded[i][k] = false;
        }
        this.allergenIsExpanded[i][j] = true;
      }
    }
  }

  formatPrices(number: number) {
    return number.toFixed(2) + ' €';
  }

  slideLoaded($event) {
    const slides = $event.target;
    slides.swiper.autoplay.start();
  }

}
