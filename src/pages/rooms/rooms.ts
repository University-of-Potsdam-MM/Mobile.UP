import { Component } from '@angular/core';
import {
  IonicPage,
  NavController
} from 'ionic-angular';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams
} from "@angular/common/http";
import { WebHttpUrlEncodingCodec } from "../../providers/login-provider/lib";
import {
  IConfig,
  IHouse,
  IRoom,
  IRoomApiRequest,
  IRoomRequestResponse
} from "../../library/interfaces";
import { Storage } from "@ionic/storage";
import { TranslateService } from "@ngx-translate/core";
import { RoomplanPage } from "../roomplan/roomplan";


@IonicPage()
@Component({
  selector: 'page-rooms',
  templateUrl: 'rooms.html',
})
export class RoomsPage {

  //bindings
  select_timeslot: string;
  refresher: any;

  //vars
  housesFound:IHouse[] = [];
  time_slots: any;
  current_timeslot: any;
  current_location: string;
  error: HttpErrorResponse;
  no_timeslot:boolean = false;

  constructor(
    private storage: Storage,
    public navCtrl: NavController,
    public translate : TranslateService,
    public http: HttpClient) {
  }

  ionViewDidLoad() {
    this.current_timeslot = RoomsPage.getCurrentTimeslot();

    this.time_slots = [];
    for (let i = 8; i < 22; i = i + 2) {
      let slot = {"lbl": i + " - " + (i + 2), "value": i};
      this.time_slots.push(slot)
    }
    this.select_timeslot = this.current_timeslot.start;
  }

  /**
   * gets the slot start and end time for the current time
   * @returns {{start: number; end: number; error: boolean}} - start/end hour, error = true when out of bounds (8-22)
   */
  static getCurrentTimeslot() {
    let now = new Date();

    for (let i = 8; i < 22; i = i + 2) {
      let start = new Date();
      start.setHours(i);
      let end = new Date();
      end.setHours((i + 2));

      if (start <= now && end > now) {
        return {"start": i, "end": (i + 2), "error": false}
      }
    }

    return {"start": 0, "end": 0, "error": true}
  }

  /**
   * Called when free room entry is clicked to open page with complete plan for selected room
   * @param {IHouse} house - current house
   * @param {IRoom} room - selected room in current house
   */
  openRoomPlan(house:IHouse, room:IRoom){
    this.navCtrl.push(RoomplanPage, {
      house: house,
      room: room
    })
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
  switchLocation($event) {
    this.housesFound = [];
    var location; 
    if ($event == "Griebnitzsee") {
      location = "3";
    } else if ($event == "NeuesPalais") {
      location = "1";
    } else { location = "2"; }
    this.current_location = location;
    this.getRoomInfo()
  }

  /**
   * Changes timeslot of day that should be displayed
   * Info comes from DOM select element "select_timeslot"
   */
  changeTimeSlot(){
    this.housesFound = [];
    this.current_timeslot =  {"start":this.select_timeslot, "end": (this.select_timeslot + 2),"error":false};
    this.getRoomInfo();
  }

  /**
   * Expands house to show rooms
   * @param house - house lbl
   */
  expand(house){
    for (let i = 0; i < this.housesFound.length; i++) {
      if(this.housesFound[i].lbl == house){
        this.housesFound[i].expanded = !this.housesFound[i].expanded;
      }else{
        this.housesFound[i].expanded = false;
      }
    }
  }

  /**
   * Main function to query api and build array that is later parsed to DOM
   * Gets all its parameters from pages global vars (location, timeslot)
   * @returns {Promise<void>}
   */
  async getRoomInfo() {
    if (this.current_timeslot.error){
      this.no_timeslot = true;
      this.housesFound = [];
      return;
    }

    this.no_timeslot = false;
    let location = this.current_location;
    let config: IConfig = await this.storage.get("config");

    let roomRequest: IRoomApiRequest = {
      authToken: config.authorization.credentials.accessToken,
    };

    let headers: HttpHeaders = new HttpHeaders()
      .append("Authorization", roomRequest.authToken);

    let start = new Date();
    let end = new Date();
    start.setHours(this.current_timeslot.start);
    end.setHours(this.current_timeslot.end);

    let params: HttpParams = new HttpParams({encoder: new WebHttpUrlEncodingCodec()})
      .append("format", "json")
      .append("startTime", start.toISOString())
      .append("endTime", end.toISOString())
      .append("campus", location);

    this.http.get(config.webservices.endpoint.roomsSearch, {headers: headers, params: params}).subscribe(
      (response: IRoomRequestResponse) => {
        this.housesFound = [];
        this.error = null;
        for (let response_room of response.rooms4TimeResponse.return) {

          let split = response_room.split(".");

          let room:IRoom = {
            lbl: split.splice(2,5).join('.')
          };

          let house:IHouse = null;
          for (let i = 0; i < this.housesFound.length; i++) {
            if(this.housesFound[i].lbl == split[1]){
              house = this.housesFound[i];
              house.rooms.push(room);
              this.housesFound[i] = house;
            }
          }

          if(house == null){
            house = {
              lbl:split[1],
              rooms: [room],
              expanded: false
            };
            this.housesFound.push(house);
          }

        }

        //sort elements for nicer display
        this.housesFound.sort(RoomplanPage.compareHouses);
        this.housesFound.forEach(function (house) {
          house.rooms.sort(RoomplanPage.compareRooms);
        });

        if (this.refresher != null) {
          this.refresher.complete()
        }
      },
      (error: HttpErrorResponse) => {
        console.log(error);
        this.error = error;
        this.housesFound = [];
        if (this.refresher != null) {
          this.refresher.complete()
        }
      }
    );
  }
}
