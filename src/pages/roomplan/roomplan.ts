import {Component} from '@angular/core';
import {IonicPage, NavParams, ToastController} from 'ionic-angular';
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

  //params
  default_house:IHouse;
  default_room:IRoom;

  //bindings
  segment_locations: string;
  select_day:string;
  refresher: any;
  days: any;

  //vars
  houseMap: Map<string, IHousePlan> = new Map<string, IHousePlan>();
  housesFound: Array<IHouse> = [];
  day_offset:string;
  response: any;
  current_location: string;
  error: HttpErrorResponse;

  constructor(
    private storage: Storage,
    public toastCtrl: ToastController,
    public navParams: NavParams,
    public translate: TranslateService,
    public http: HttpClient) {
    this.default_house = navParams.get("house");
    this.default_room = navParams.get("room");
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RoomsPage');
    this.segment_locations = RoomplanPage.getLocationByNum(this.current_location);
    this.switchLocation("3"); // TODO load default tab from user settings/history
    this.day_offset = "0";

    this.days = [];
    for(let i = 0; i < 7; i++){
      let day:Date = new Date();
      day.setDate(day.getDate() + i);
      this.days.push({"lbl": day, "value": i.toString()})
    }
    this.select_day = this.day_offset
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

  /**
   * Changes the day for which to load data
   * Day comes from DOM select element "select_day"
   */
  changeDay(){
    this.housesFound = [];
    this.houseMap = new Map<string, IHousePlan>();
    this.day_offset = this.select_day;
    this.getRoomInfo();
  }

  /**
   * Called by refresher element to refresh info
   * @param refresher - DOM refresher element, passed for later closing
   * @returns {Promise<void>}
   */
  async refreshRoom(refresher) {
    this.getRoomInfo();
    this.refresher = refresher
  }

  /**
   * Switch campus location and reload info for new campus
   * @param location - number as string representing campus
   */
  switchLocation(location) {
    this.houseMap = new Map<string, IHousePlan>();
    this.housesFound = [];
    this.current_location = location;
    this.getRoomInfo()
  }

  /**
   * Expand house expandable to show rooms
   * Closes rooms when house is closed
   * @param house - lbl of house to close
   */
  public expandHouse(house) {
    for (let i = 0; i < this.housesFound.length; i++) {
      if (this.housesFound[i].lbl == house) {
        this.housesFound[i].expanded = !this.housesFound[i].expanded;
      } else {
        this.housesFound[i].expanded = false;
      }
      if(this.housesFound[i].expanded == false){
        this.housesFound[i].rooms.forEach(function (room) {
          room.expanded = false;
        })
      }
    }
  }

  /**
   * Expand room expandable to show events
   * @param house - lbl of house to close
   * @param room - lbl of room to close
   */
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

  /**
   * Adds a room to a house (specified by its lbl)
   * If the house does not exist one is created
   * Room is only added if house does not already have that room (identified by lbl)
   * @param houseLbl - lbl of house to add room for
   * @param {IRoom} room - room to add to house
   */
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

  /**
   * Main function to query api and build array that is later parsed to DOM
   * Gets all its parameters from pages global vars (location, day, default house/room)
   * @returns {Promise<void>}
   */
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
    start.setDate(start.getDate() + +this.day_offset); // unary plus for string->num conversion
    end.setDate(end.getDate() + +this.day_offset);

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

              persons = persons.filter(this.uniqueFilter);

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

        let default_error = "";
        if(this.default_house != null){
          if(this.houseMap.has(this.default_house.lbl)){
            this.houseMap.get(this.default_house.lbl).expanded = true;

            if(this.default_room != null){
              if(this.houseMap.get(this.default_house.lbl).rooms.has(this.default_room.lbl)){
                this.houseMap.get(this.default_house.lbl).rooms.get(this.default_room.lbl).expanded = true;
              }else{
                default_error = "page.roomplan.no_room";
              }
            }
          }else{
            default_error = "page.roomplan.no_house";
          }
        }

        if (default_error != ""){
          this.translate.get(default_error).subscribe(
            value => {
              const toast = this.toastCtrl.create({
                message: value,
                duration: 5000
              });
              toast.present();
            }
          )
        }

        //sadly templates cannot parse maps,
        // therefore we will generate a new data structure based on arrays and parse everything into there

        let tmpHouseList = Array.from(this.houseMap.values());
        console.log(tmpHouseList);
        for (let i = 0; i < tmpHouseList.length; i++) {
          let tmpRoomArray = Array.from(tmpHouseList[i].rooms.values());

          tmpRoomArray.sort(RoomplanPage.compareRooms);
          for(let h = 0; h < tmpRoomArray.length; h++){
            tmpRoomArray[h].events.sort(RoomplanPage.compareEvents);
          }

          let tmpHouse: IHouse = {
            lbl: tmpHouseList[i].lbl,
            rooms: tmpRoomArray,
            expanded: tmpHouseList[i].expanded
          };
          this.housesFound.push(tmpHouse);
        }
        this.housesFound.sort(RoomplanPage.compareHouses);
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

  /**
   * Comparator for event sorting
   * @param {IRoomEvent} a
   * @param {IRoomEvent} b
   * @returns {number}
   */
  static compareEvents(a:IRoomEvent, b:IRoomEvent) {
    if (a.startTime < b.startTime)
      return -1;
    if (a.startTime > b.startTime)
      return 1;
    return 0;
  }

  /**
   * Comparator for room sorting
   * @param {IRoomEvent} a
   * @param {IRoomEvent} b
   * @returns {number}
   */
  static compareRooms(a:IRoom, b:IRoom) {
    if (a.lbl > b.lbl) // inverted normal sort order so rooms starting with letters come first
      return -1;
    if (a.lbl < b.lbl)
      return 1;
    return 0;
  }

  /**
   * Comparator for house
   * @param {IRoomEvent} a
   * @param {IRoomEvent} b
   * @returns {number}
   */
  static compareHouses(a:IHouse, b:IHouse) {
    if (a.lbl < b.lbl)
      return -1;
    if (a.lbl > b.lbl)
      return 1;
    return 0;
  }

  /**
   * Filter for person array uniqueness
   * @param value
   * @param index
   * @param self
   * @returns {boolean}
   */
  uniqueFilter(value, index, self) {
    return self.indexOf(value) === index;
  }
}
