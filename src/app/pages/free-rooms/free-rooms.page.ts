import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse, HttpHeaders, HttpParams, HttpClient } from '@angular/common/http';
import { CacheService } from 'ionic-cache';
import { RoomplanPage } from '../roomplan/roomplan.page';
import { Events } from '@ionic/angular';
import { IHouse, IRoomApiRequest, IRoomRequestResponse, IRoom } from 'src/app/lib/interfaces';
import { ConnectionService } from 'src/app/services/connection/connection.service';
import { AlertService } from 'src/app/services/alert/alert.service';
import { ConfigService } from 'src/app/services/config/config.service';
import { WebHttpUrlEncodingCodec } from 'src/app/services/login-provider/lib';

@Component({
  selector: 'app-free-rooms',
  templateUrl: './free-rooms.page.html',
  styleUrls: ['./free-rooms.page.scss'],
})
export class FreeRoomsPage implements OnInit {

  // bindings
  select_timeslot: string;
  refresher: any;

  // vars
  housesFound: IHouse[] = [];
  time_slots: any;
  current_timeslot: any;
  current_location: string;
  error: HttpErrorResponse;
  no_timeslot = false;

  constructor(
    private connection: ConnectionService,
    private cache: CacheService,
    private http: HttpClient,
    private alertProvider: AlertService,
    private swipeEvent: Events
  ) { }

  ngOnInit() {
    this.connection.checkOnline(true, true);
    this.current_timeslot = this.getCurrentTimeslot();

    this.time_slots = [];
    for (let i = 8; i < 22; i = i + 2) {
      const slot = {'lbl': i + ' - ' + (i + 2), 'value': i};
      this.time_slots.push(slot);
    }
    this.select_timeslot = this.current_timeslot.start;
  }

  /**
   * gets the slot start and end time for the current time
   * @returns {{start: number; end: number; error: boolean}} - start/end hour, error = true when out of bounds (8-22)
   */
  getCurrentTimeslot() {
    const now = new Date();

    for (let i = 8; i < 22; i = i + 2) {
      const start = new Date();
      start.setHours(i);
      const end = new Date();
      end.setHours((i + 2));

      if (start <= now && end > now) {
        return {'start': i, 'end': (i + 2), 'error': false};
      }
    }

    return {'start': 0, 'end': 0, 'error': true};
  }

  /**
   * Called when free room entry is clicked to open page with complete plan for selected room
   * @param {IHouse} house - current house
   * @param {IRoom} room - selected room in current house
   */
  // openRoomPlan(house:IHouse, room:IRoom){
  //   this.navCtrl.push(RoomplanPage, {
  //     house: house,
  //     room: room,
  //     campus: this.current_location
  //   })
  // }

  /**
   * Called by refresher element to refresh info
   * @param refresher - DOM refresher element, passed for later closing
   * @returns {Promise<void>}
   */
  refreshRoom(refresher) {
    this.getRoomInfo();
    this.refresher = refresher;
  }

  /**
   * Switch campus location and reload info for new campus
   * @param location - number as string representing campus
   */
  switchLocation($event) {
    this.housesFound = [];
    let location;
    if ($event === 'Griebnitzsee') {
      location = '3';
    } else if ($event === 'NeuesPalais') {
      location = '1';
    } else { location = '2'; }
    this.current_location = location;
    this.getRoomInfo();
  }

  /**
   * Changes timeslot of day that should be displayed
   * Info comes from DOM select element "select_timeslot"
   */
  changeTimeSlot() {
    this.housesFound = [];
    this.current_timeslot =  {'start': this.select_timeslot, 'end': (this.select_timeslot + 2), 'error': false};
    this.getRoomInfo();
  }

  /**
   * Expands house to show rooms
   * @param house - house lbl
   */
  expand(house) {
    for (let i = 0; i < this.housesFound.length; i++) {
      if (this.housesFound[i].lbl === house) {
        this.housesFound[i].expanded = !this.housesFound[i].expanded;
      } else {
        this.housesFound[i].expanded = false;
      }
    }
  }

  /**
   * Main function to query api and build array that is later parsed to DOM
   * Gets all its parameters from pages global vars (location, timeslot)
   * @returns {Promise<void>}
   */
  getRoomInfo() {
    if (this.current_timeslot.error) {
      this.no_timeslot = true;
      this.housesFound = [];
      return;
    }

    this.no_timeslot = false;
    const location = this.current_location;
    const config = ConfigService.config;

    const roomRequest: IRoomApiRequest = {
      authToken: config.authorization.credentials.accessToken,
    };

    const headers: HttpHeaders = new HttpHeaders()
      .append('Authorization', roomRequest.authToken);

    const start = new Date();
    const end = new Date();
    start.setHours(this.current_timeslot.start);
    end.setHours(this.current_timeslot.end);

    const params: HttpParams = new HttpParams({encoder: new WebHttpUrlEncodingCodec()})
      .append('format', 'json')
      .append('startTime', start.toISOString())
      .append('endTime', end.toISOString())
      .append('campus', location);

    if (this.refresher != null) {
      this.cache.removeItem('roomInfo' + location + start.toString() + end.toString());
    }

    const request = this.http.get(config.webservices.endpoint.roomsSearch, {headers: headers, params: params});
    this.cache.loadFromObservable('roomInfo' + location + start.toString() + end.toString(), request).subscribe(
      (response: IRoomRequestResponse) => {
        this.housesFound = [];
        this.error = null;
        for (const response_room of response.rooms4TimeResponse.return) {

          const split = response_room.split('.');

          const room: IRoom = {
            lbl: split.splice(2, 5).join('.')
          };

          let house: IHouse = null;
          for (let i = 0; i < this.housesFound.length; i++) {
            if (this.housesFound[i].lbl === split[1]) {
              house = this.housesFound[i];
              house.rooms.push(room);
              this.housesFound[i] = house;
            }
          }

          if (house == null) {
            house = {
              lbl: split[1],
              rooms: [room],
              expanded: false
            };
            this.housesFound.push(house);
          }

        }

        // sort elements for nicer display
        this.housesFound.sort(RoomplanPage.compareHouses);
        this.housesFound.forEach(function (house) {
          house.rooms.sort(RoomplanPage.compareRooms);
        });

        if (this.refresher != null) {
          this.refresher.target.complete();
        }
      },
      (error: HttpErrorResponse) => {
        console.log(error);
        this.error = error;
        this.housesFound = [];
        this.no_timeslot = true;
        if (this.refresher != null) {
          this.refresher.target.complete();
        }

        this.alertProvider.showAlert({
          alertTitleI18nKey: 'alert.title.error',
          messageI18nKey: `alert.httpErrorStatus.${error.status}`
        });
      }
    );
  }

  swipeCampus(event) {
    if (Math.abs(event.deltaY) < 50) {
      if (event.deltaX > 0) {
        // user swiped from left to right
        this.swipeEvent.publish('campus-swipe-to-right', this.getLocationByNum(this.current_location));
      } else if (event.deltaX < 0) {
        // user swiped from right to left
        this.swipeEvent.publish('campus-swipe-to-left', this.getLocationByNum(this.current_location));
      }
    }
  }

    /**
   * Convert campus number to short string (for localization)
   * @param num - Campus number (1-3)
   * @returns {string} - campus short string (gs,np,go), defaults to gs
   */
  getLocationByNum(num) { // one could use numbers everywhere, but this is better for readability
    switch (num) {
      case '1': {
        return 'NeuesPalais';
      }
      case '2': {
        return 'Golm';
      }
      case '3': {
        return 'Griebnitzsee';
      }
      default: {
        return 'Griebnitzsee';
      }
    }
  }

}
