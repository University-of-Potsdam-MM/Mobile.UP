import {Component} from '@angular/core';
import {IonicPage} from 'ionic-angular';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from "@angular/common/http";
import {WebHttpUrlEncodingCodec} from "../../providers/login-provider/lib";
import {
  IConfig,
  IHouse, IHousePlan,
  IReservationRequestResponse,
  IRoom,
  IRoomApiRequest, IRoomPlan,
  IRoomRequestResponse
} from "../../library/interfaces";
import {Storage} from "@ionic/storage";
import {TranslateService} from "@ngx-translate/core";

/**
 * Generated class for the RoomsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-roomplan',
  templateUrl: 'roomplan.html',
})
export class RoomplanPage {

  //bindings
  segment_locations: string;
  refresher: any;

  //vars
  houseMap : Map<string, IHousePlan> = new Map<string, IHousePlan>();
  housesFound:Array<IHousePlan>;
  response:any;
  current_location: string;
  error: HttpErrorResponse;

  constructor(
    private storage: Storage,
    public translate : TranslateService,
    public http: HttpClient) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RoomsPage');

    this.segment_locations = RoomplanPage.getLocationByNum(this.current_location);
    this.switchLocation("3"); // TODO load default tab from user settings/history
  }

  /**
   * Convert campus number to short string (for localization)
   * @param num - Campus number (1-3)
   * @returns {string} - campus short string (gs,np,go), defaults to gs
   */
  static getLocationByNum(num) { // one could use numbers everywhere, but this is better for readability
    switch (num) {
      case "1": {
        return "np"
      }
      case "2": {
        return "go"
      }
      case "3": {
        return "gs"
      }
      default: {
        return "gs"
      }
    }
  }

  async refreshRoom(refresher) {
    this.getRoomInfo();
    this.refresher = refresher
  }

  switchLocation(location){
    this.houseMap = new Map<string, IHousePlan>();
    this.current_location = location;
    this.getRoomInfo()
  }

  expand(item){
    for (let i = 0; i < this.houseMap.size; i++) {
      if(this.houseMap[i].lbl == item){
        this.houseMap[i].expanded = !this.houseMap[i].expanded;
      }else{
        this.houseMap[i].expanded = false;
      }
    }
  }

  addRoomToHouse(houseLbl,room:IRoomPlan){
    let house:IHousePlan;
    if(this.houseMap.has(houseLbl)){
      house = this.houseMap.get(houseLbl);
    }else{
      house = {
        lbl:houseLbl,
        rooms: new Map<string, IRoomPlan>(),
        expanded: false
      };
    }

    house.rooms.set(room.lbl,room);
    this.houseMap.set(houseLbl,house);
  }

  async getRoomInfo() {

    let location = this.current_location;

    let config: IConfig = await this.storage.get("config");

    let roomRequest: IRoomApiRequest = {
      authToken: config.authorization.credentials.accessToken,
    };

    let url = "https://apiup.uni-potsdam.de/endpoints/roomsAPI/1.0/reservations?";

    let headers: HttpHeaders = new HttpHeaders().append("Authorization", roomRequest.authToken);

    let start = new Date();
    let end = new Date();
    start.setHours(8);
    end.setHours(22);

    let params: HttpParams = new HttpParams({encoder: new WebHttpUrlEncodingCodec()})
      .append("format", "json")
      .append("startTime", start.toISOString())
      .append("endTime", end.toISOString())
      .append("campus", location);

    this.http.get(url, {headers: headers, params: params}).subscribe(
      (response: IReservationRequestResponse) => {
        this.houseMap = new Map<string, IHousePlan>();
        this.error = null;

        for (let reservation of response.reservationsResponse.return) {

          if ((reservation.roomList.room instanceof Array) == false){
            reservation.roomList.room = [reservation.roomList.room]
          }

          let roomList = <Array<string>> reservation.roomList.room;
          for(let i = 0; i < roomList.length; i++){
            let split = roomList[i].split(".");
            let room:IRoomPlan = {
              lbl: split.splice(2,5).join('.'),
              events: []
            };

            this.addRoomToHouse(split[1],room);
          }
        }
        console.log(this.houseMap);
        if (this.refresher != null) {
          this.refresher.complete()
        }
      },
      (error: HttpErrorResponse) => {
        console.log(error);
        this.error = error;
        this.houseMap = new Map<string, IHousePlan>();
        if (this.refresher != null) {
          this.refresher.complete()
        }
      }
    );
  }
}
