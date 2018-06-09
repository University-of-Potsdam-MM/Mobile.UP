import {Component} from '@angular/core';
import {IonicPage} from 'ionic-angular';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from "@angular/common/http";
import {WebHttpUrlEncodingCodec} from "../../providers/login-provider/lib";
import {
  IConfig,
  IHouse, IHousePlan,
  IReservationRequestResponse,
  IRoom,
  IRoomApiRequest, IRoomEvent
} from "../../library/interfaces";
import {Storage} from "@ionic/storage";
import {TranslateService} from "@ngx-translate/core";
import {strictEqual} from "assert";

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
  houseMap: Map<string, IHousePlan> = new Map<string, IHousePlan>();
  housesFound: Array<IHouse> = [];
  response: any;
  current_location: string;
  error: HttpErrorResponse;

  constructor(
    private storage: Storage,
    public translate: TranslateService,
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

  switchLocation(location) {
    this.houseMap = new Map<string, IHousePlan>();
    this.housesFound = [];
    this.current_location = location;
    this.getRoomInfo()
  }

  public expandHouse(house) {
    for (let i = 0; i < this.housesFound.length; i++) {
      if (this.housesFound[i].lbl == house) {
        this.housesFound[i].expanded = !this.housesFound[i].expanded;
      } else {
        this.housesFound[i].expanded = false;
      }
    }
  }

  public expandRoom(house, room) {
    for (let i = 0; i < this.housesFound.length; i++) {
      if (this.housesFound[i].lbl == house) {
        for (let h = 0; h < this.housesFound[i].rooms.length; h++) {
          if (this.housesFound[i].rooms[h].lbl == room) {
            this.housesFound[i].rooms[h].expanded = !this.housesFound[i].rooms[h].expanded;
          } else {
            this.housesFound[i].rooms[h].expanded = false;
          }
        }
      }
    }
  }

  addRoomToHouse(houseLbl, room: IRoom) {
    let house: IHousePlan;
    if (this.houseMap.has(houseLbl)) {
      house = this.houseMap.get(houseLbl);
    } else {
      house = {
        lbl: houseLbl,
        rooms: new Map<string, IRoom>(),
        expanded: false
      };
    }

    if (house.rooms.has(room.lbl) == false) {
      house.rooms.set(room.lbl, room);
      this.houseMap.set(houseLbl, house);
    }
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
    start.setDate(start.getDate() + 2);
    end.setDate(end.getDate() + 2);

    let params: HttpParams = new HttpParams({encoder: new WebHttpUrlEncodingCodec()})
      .append("format", "json")
      .append("startTime", start.toISOString())
      .append("endTime", end.toISOString())
      .append("campus", location);

    this.http.get(url, {headers: headers, params: params}).subscribe(
      (response: IReservationRequestResponse) => {
        this.houseMap = new Map<string, IHousePlan>();
        this.housesFound = [];
        this.error = null;

        for (let reservation of response.reservationsResponse.return) {
          // API often returns basically empty reservations, we want to ignore these
          if (reservation.veranstaltung != "" && reservation.veranstaltung != null) {

            if ((reservation.roomList.room instanceof Array) == false) {
              reservation.roomList.room = [reservation.roomList.room]
            }

            let roomList = <Array<string>> reservation.roomList.room;
            for (let i = 0; i < roomList.length; i++) {
              let split = roomList[i].split(".");
              let room: IRoom = {
                lbl: split.splice(2, 5).join('.'),
                events: [],
                expanded: false
              };

              this.addRoomToHouse(split[1], room);

              let persons:Array<String> = [];
              let personArray = reservation.personList.person;
              for(let h = 0; h < personArray.length; h = h + 2){
                if(personArray[h] == "N.N" ){
                  persons.push("N.N ")
                }
                if(personArray[h] != "" && personArray[h + 1] != ""){
                  persons.push(personArray[h + 1].trim() + " " + personArray[h].trim())
                }
              }

              let event: IRoomEvent = {
                lbl: reservation.veranstaltung,
                startTime: new Date(reservation.startTime),
                endTime: new Date(reservation.endTime),
                persons: persons
              };

              this.houseMap.get(split[1]).rooms.get(room.lbl).events.push(event)
            }
          }
        }

        //sadly templates cannot parse maps,
        // therefore we will generate a new data structure based on arrays and parse everything into there

        let tmpHouseList = Array.from(this.houseMap.values());
        console.log(tmpHouseList);
        for (let i = 0; i < tmpHouseList.length; i++) {
          let tmpRoomArray = Array.from(tmpHouseList[i].rooms.values());
          let tmpHouse: IHouse = {
            lbl: tmpHouseList[i].lbl,
            rooms: tmpRoomArray,
            expanded: false
          };
          this.housesFound.push(tmpHouse);
        }
        console.log(this.housesFound);

        if (this.refresher != null) {
          this.refresher.complete()
        }
      }
      ,
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
