import {Component} from '@angular/core';
import {IonicPage} from 'ionic-angular';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from "@angular/common/http";
import {WebHttpUrlEncodingCodec} from "../../providers/login-provider/lib";
import {IConfig, IRoomRequest, IRoomRequestResponse} from "../../library/interfaces";
import {Storage} from "@ionic/storage";
import { ToastController } from 'ionic-angular';

/**
 * Generated class for the RoomsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-rooms',
  templateUrl: 'rooms.html',
})
export class RoomsPage {

  roomsFound:String[] = [];
  current_location:string = "3"; // TODO load default tab from user settings/history
  locations:string;
  error:HttpErrorResponse;

  refresher:any;

  constructor(
    public toastCtrl: ToastController,
    private storage: Storage,
    public http: HttpClient) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RoomsPage');
    this.getRoomInfo(this.current_location);
    this.locations = RoomsPage.getLocationByNum(this.current_location)
  }

  static getLocationByNum(num){
    switch (num){
      case "1": {
        return "np"
      }
      case "2": {
        return "go"
      }
      case "3": {
        return "gs"
      }
      default:{
        return "gs"
      }
    }
  }

  async refreshRoom(refresher){
    this.getRoomInfo(this.current_location);
    this.refresher = refresher
  }

  async getRoomInfo(location) {
    this.current_location = location;

    let config: IConfig = await this.storage.get("config");

    let roomRequest: IRoomRequest = {
      authToken: config.authorization.credentials.accessToken,
    };

    let url = "https://apiup.uni-potsdam.de/endpoints/roomsAPI/1.0/rooms4Time?";

    let headers: HttpHeaders = new HttpHeaders()
      .append("Authorization", roomRequest.authToken);


    let params: HttpParams = new HttpParams({encoder: new WebHttpUrlEncodingCodec()})
      .append("format", "json")
      .append("startTime", "2018-06-07T08:09:22.014")
      .append("endTime", "2018-06-07T10:09:22.014Z")
      .append("campus", location);

    this.http.get(url, {headers: headers, params: params}).subscribe(
      (response: IRoomRequestResponse) => {
        this.roomsFound = [];
        this.error = null;
        for(let room of response.rooms4TimeResponse.return) {
          this.roomsFound.push(room);
        }
        if (this.refresher != null){
          this.refresher.complete()
        }
      },
      (error: HttpErrorResponse) => {
        console.log(error);
        this.error = error;
        this.roomsFound = [];
        if (this.refresher != null){
          this.refresher.complete()
        }
      }
    );

  }

}
