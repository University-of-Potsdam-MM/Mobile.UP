import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { WebHttpUrlEncodingCodec } from "../../library/util";
import { Storage } from "@ionic/storage";
import { ISession } from "../../providers/login-provider/interfaces";
import { LoginPage } from "../login/login";
import {
  IConfig,
  IPerson,
  IMensaResponse
} from "../../library/interfaces";


@IonicPage()
@Component({
  selector: 'page-mensa',
  templateUrl: 'mensa.html',
})
export class MensaPage {

  personsFound:IPerson[] = [];
  campus:String = '';
  myDate: Date;
  public isLoaded = false;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private http: HttpClient,
    private storage: Storage) {
    this.campus = "campus2";
    this.myDate = new Date();
    this.isLoaded = false;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MensaPage');
  }

  public ngOnInit() {
    this.changeCampus('Golm');
  }


  /**
   * checks whether a session is stored in memory. If not the user is taken to
   * the LoginPage. If yes a query is sent to the API and the results are placed
   * in this.personsFound so the view can render them
   * @param query
   */
  public async changeCampus(event: any) {
    // reset array so new persons are displayed
    console.log(this.campus);
    this.personsFound = [];




    if(event) {
      //console.log(`[PersonsPage]: Searching for \"${query}\"`);

      let session:ISession = await this.storage.get("session");
      let config:IConfig = await this.storage.get("config");

      if(session) {
        let headers: HttpHeaders = new HttpHeaders()
          .append("Authorization", config.webservices.apiToken);

        let params: HttpParams = new HttpParams({encoder: new WebHttpUrlEncodingCodec()})
          .append("location",        "Golm");

        this.http.get(
          config.webservices.endpoint.mensa,
          {headers:headers, params:params}
          ).subscribe(
          (response:IMensaResponse) => {
            // use inner object only because it's wrapped in another object
            for(let meal of response.meal) {
              console.log(meal);
              //this.personsFound.push(meal);
            }
            this.isLoaded = true;
          },
          error => {
            console.log(error)
          }
        );
      } else {
        // send user to LoginPage if no session has been found
        this.navCtrl.push(LoginPage);
      }
    } else {
      console.log("[PersonsPage]: Empty query");
    }
  }

}
