import { Component, Input } from '@angular/core';
import { IMeals } from '../../library/interfaces';

@Component({
  selector: 'mensa-meal',
  templateUrl: 'mensa-meal.html'
})
export class MensaMealComponent {

  @Input() meals: IMeals[];
  @Input() mealForDate: boolean[];
  @Input() onlyVeganFood: boolean;
  @Input() onlyVeggieFood: boolean;
  @Input() mealIsVegan: boolean[];
  @Input() mealIsVegetarian: boolean[];
  @Input() mealIsExpanded: boolean[];
  @Input() allergenIsExpanded: boolean[][];
  @Input() iconMapping;

  constructor() {
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
    var j,k;
    if (this.mealIsExpanded[i]) {
      this.mealIsExpanded[i] = false;
      if (this.meals[i].allergens) {
        for (k = 0; k < this.meals[i].allergens.length; k++) {
          this.allergenIsExpanded[i][k] = false;
        }
      }
    } else {
      for (j = 0; j < this.meals.length; j++) {
        this.mealIsExpanded[j] = false;
        if (this.meals[j].allergens) {
          for (k = 0; k < this.meals[j].allergens.length; k++) {
            this.allergenIsExpanded[j][k] = false;
          }
        }
      }
      this.mealIsExpanded[i] = true;
    }
  }

  expandAllergen(i,j) {
    var k;
    if (this.allergenIsExpanded[i][j]) {
      this.allergenIsExpanded[i][j] = false;
    } else {
      if (this.meals[i].allergens) {
        for (k = 0; k < this.meals[i].allergens.length; k++) {
          this.allergenIsExpanded[i][k] = false;
        }
        this.allergenIsExpanded[i][j] = true;
      }
    }
  }

  formatPrices(number:number) {
    return number.toFixed(2) + " €";
  }

}
