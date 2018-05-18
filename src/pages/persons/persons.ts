import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';

@IonicPage()
@Component({
  selector: 'page-persons',
  templateUrl: 'persons.html',
})
export class PersonsPage {


  url: string = "https://apiup.uni-potsdam.de/endpoints/personsAPI/1.0/";
  private resultsList: Array < Object > ;
  private query: string;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private http: HttpClient) {

  }

  /**
   * sendRequest
   *
   * sends a HTTP-request and returns an Observable in which the response can be
   * observed.
   * @param query
   */
  private sendRequest(query: string): Observable < Object > {
    var headers: HttpHeaders = new HttpHeaders();
    var params: HttpParams = new HttpParams();

    headers.set("Authorization", "Bearer c58bcde9-973d-37ff-8290-c57a82b73daf");

    /*
      Here it should be checked, whether the user is already logged in. If so, the
      token can be used, if not the user should be redirected to the login page
    */

    params.set("value", query);
    //params.set("username", this.auth.getUserInfo().id); // temporary
    //params.set("password", this.auth.getUserInfo().id); // temporary

    params.set("username", "elistest");
    params.set("password", "%2B_eLiS%3F14");

    // creates an Observable and returns it so that the reciever can access the
    // results
    return Observable.create(
      observer => {
        this.http.get(
          this.url, {headers: headers,params: params}
        ).subscribe(
          results => {
            console.log(results);

          }
        );
      }
    );
  }

  private showResults() {

  }

  private search(query: string) {
    this.sendRequest(query);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad PersonsPage, not testing');
    this.search("Dieter");
  }

}
