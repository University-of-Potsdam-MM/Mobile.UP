import {
  Component,
  ChangeDetectorRef
} from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams
} from 'ionic-angular';
import {
  EmergencyCall
} from "../../library/interfaces";
import * as jquery from "jquery";

/**
 * Class for a page that shows EmergencyCall entries. The list of items can
 * be filtered by using a searchbox.
 */
@IonicPage()
@Component({
  selector: 'page-emergency',
  templateUrl: 'emergency.html'
})
export class EmergencyPage {

  jsonPath: string = "../../assets/json/pages/emergency";
  displayedList: ArrayLike < EmergencyCall > ;
  defaultList: ArrayLike < EmergencyCall > ;

  /**
   * Constructor of EmergencyPage
   * @param navCtrl
   * @param navParams
   */
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private chRef: ChangeDetectorRef) {
    this.loadData();
    this.initializeList();
  };

  /**
   * initializeList
   *
   * initializes the list that is to be displayed with default values
   */
  public initializeList(): void {
    this.displayedList = this.defaultList;
  }

  /**
   * loadData
   *
   * loads default items from json file
   */
  public loadData(): void {
    this.defaultList = require("../../assets/json/pages/emergency");
  }

  /**
   * contains
   *
   * checks, whether y is a substring of x
   *
   * @param x:string String that does or does not contain string y
   * @param y:string String that is or is not contained in string y
   * @returns boolean Whether string x contains string y
   */
  private contains(x: string, y: string): boolean {
    return x.toLowerCase().includes(y.toLowerCase());
  }

  /**
   * filterItems
   *
   * when a query is typed into the searchbar this method is called. It
   * filters the complete list of items with the query and modifies the
   * displayed list accordingly.
   *
   * @param query:string A query string the items will be filtered with
   */
  public filterItems(query: string): void {
    this.initializeList();

    if (query) {
      this.displayedList = jquery.grep(
        this.defaultList,
        (emergencyCall, index) => {
          return this.contains(emergencyCall.name, query);
        }
      );
      this.chRef.detectChanges();
    }
  }
}
