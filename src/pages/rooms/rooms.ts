import {Component} from '@angular/core';
import {IonicPage} from 'ionic-angular';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from "@angular/common/http";
import {WebHttpUrlEncodingCodec} from "../../providers/login-provider/lib";
import {IConfig, IRoomRequest, IRoomRequestResponse} from "../../library/interfaces";
import {Storage} from "@ionic/storage";

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

  constructor(
    private storage: Storage,
    public http: HttpClient) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RoomsPage');
    this.getRoomInfo();
  }


  async getRoomInfo() {
    this.roomsFound = [];

    let config: IConfig = await this.storage.get("config");

    let roomRequest: IRoomRequest = {
      authToken: config.authorization.credentials.accessToken,
    };

    let url = "https://apiup.uni-potsdam.de/endpoints/roomsAPI/1.0/rooms4Time?";

    // https://apiup.uni-potsdam.de/endpoints/roomsAPI/1.0/rooms4Time?format=json&startTime=2018-06-07T08:09:22.014Z&endTime=2018-06-07T10:09:22.014Z&campus=3

    let headers: HttpHeaders = new HttpHeaders()
      .append("Authorization", roomRequest.authToken);


    let params: HttpParams = new HttpParams({encoder: new WebHttpUrlEncodingCodec()})
      .append("format", "json")
      .append("startTime", "2018-06-07T08:09:22.014")
      .append("endTime", "2018-06-07T10:09:22.014Z")
      .append("campus", "3");

    this.http.get(url, {headers: headers, params: params}).subscribe(
      (response: IRoomRequestResponse) => {
        console.log(response)
        for(let room of response.rooms4TimeResponse.return) {
          this.roomsFound.push(room);
        }
        console.log(this.roomsFound)
      },
      (error: HttpErrorResponse) => {
        console.log(error)
      }
    );

  }

}
