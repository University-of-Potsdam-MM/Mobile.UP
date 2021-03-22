import { Component, OnInit, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RoomplanPage } from '../roomplan/roomplan.page';
import {
  IHouse,
  IRoomRequestResponse,
  IRoom,
  ICampus,
} from 'src/app/lib/interfaces';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { CampusTabComponent } from '../../components/campus-tab/campus-tab.component';
import { WebserviceWrapperService } from 'src/app/services/webservice-wrapper/webservice-wrapper.service';
import { IRoomsRequestParams } from '../../services/webservice-wrapper/webservice-definition-interfaces';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-free-rooms',
  templateUrl: './free-rooms.page.html',
  styleUrls: ['./free-rooms.page.scss'],
})
export class FreeRoomsPage extends AbstractPage implements OnInit {
  @ViewChild(CampusTabComponent, { static: false })
  campusTabComponent: CampusTabComponent;

  // bindings
  select_timeslot: string;
  refresher: any;
  isLoaded;

  // vars
  housesFound: IHouse[] = [];
  time_slots: any;
  timeLabels: string[] = [];
  current_timeslot: any;
  current_location: ICampus;
  error: HttpErrorResponse;
  no_timeslot = false;

  constructor(
    private ws: WebserviceWrapperService,
    private translate: TranslateService
  ) {
    super({ optionalNetwork: true });
  }

  ngOnInit() {
    this.current_timeslot = this.getCurrentTimeslot();

    this.time_slots = [];
    for (let i = 8; i < 22; i = i + 2) {
      const slot = { lbl: i + ' - ' + (i + 2), value: i };
      this.time_slots.push(slot);

      if (this.translate.currentLang === 'de') {
        this.timeLabels.push(slot.lbl);
      } else {
        const begin = i === 12 ? 12 : i % 12;
        const end = i + 2 === 12 ? 12 : (i + 2) % 12;
        let label = String(begin);
        if (i > 11) {
          label += ' PM';
        } else {
          label += ' AM';
        }
        label += ' - ' + end;
        if (i + 2 > 11) {
          label += ' PM';
        } else {
          label += ' AM';
        }
        this.timeLabels.push(label);
      }
    }

    const closedSlot = { lbl: 22 + ' - ' + 8, value: 22 };
    this.time_slots.push(closedSlot);
    if (this.translate.currentLang === 'de') {
      this.timeLabels.push('22 - 8');
    } else {
      this.timeLabels.push('10 PM - 8 AM');
    }

    this.select_timeslot = this.current_timeslot.start;
  }

  /**
   * gets the slot start and end time for the current time
   *
   * @returns {{start: number; end: number; error: boolean}} - start/end hour, error = true when out of bounds (8-22)
   */
  getCurrentTimeslot() {
    const now = new Date();

    for (let i = 8; i < 22; i = i + 2) {
      const start = new Date();
      start.setHours(i);
      const end = new Date();
      end.setHours(i + 2);

      if (start <= now && end > now) {
        return { start: i, end: i + 2, error: false };
      }
    }

    return { start: 22, end: 8, error: true };
  }

  /**
   * Called when free room entry is clicked to open page with complete plan for selected room
   *
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
   *
   * @param refresher - DOM refresher element, passed for later closing
   * @returns {Promise<void>}
   */
  refreshRoom(refresher?) {
    this.getRoomInfo();

    if (refresher) {
      this.refresher = refresher;
    } else {
      this.isLoaded = false;
    }
  }

  /**
   * Switch campus location and reload info for new campus
   *
   * @param campus {ICampus} the current campus
   */
  switchLocation(campus: ICampus) {
    this.housesFound = [];
    this.current_location = campus;
    this.getRoomInfo();
  }

  /**
   * Changes timeslot of day that should be displayed
   * Info comes from DOM select element "select_timeslot"
   */
  changeTimeSlot() {
    console.log(this.select_timeslot);
    this.housesFound = [];
    this.current_timeslot = {
      start: this.select_timeslot,
      end: Number(this.select_timeslot) === 22 ? 8 : this.select_timeslot + 2,
      error: Number(this.select_timeslot) === 22 ? true : false,
    };
    console.log(this.current_timeslot);
    this.getRoomInfo();
  }

  /**
   * Expands house to show rooms
   *
   * @param house - house lbl
   */
  expand(house) {
    for (const foundHouse of this.housesFound) {
      if (foundHouse.lbl === house) {
        foundHouse.expanded = !foundHouse.expanded;
      } else {
        foundHouse.expanded = false;
      }
    }
  }

  /**
   * Main function to query api and build array that is later parsed to DOM
   * Gets all its parameters from pages global vars (location, timeslot)
   *
   * @returns {Promise<void>}
   */
  getRoomInfo() {
    if (this.current_timeslot.error) {
      this.no_timeslot = true;
      this.isLoaded = true;
      this.housesFound = [];
      return;
    }

    this.no_timeslot = false;

    const startslot = new Date();
    const endslot = new Date();
    startslot.setHours(this.current_timeslot.start);
    endslot.setHours(this.current_timeslot.end);

    this.ws
      .call('roomsSearch', {
        campus: this.current_location,
        timeSlot: { start: startslot, end: endslot },
      } as IRoomsRequestParams)
      .subscribe(
        (response: IRoomRequestResponse) => {
          this.housesFound = [];
          this.error = null;
          if (
            response &&
            response.rooms4TimeResponse &&
            response.rooms4TimeResponse.return
          ) {
            for (const response_room of response.rooms4TimeResponse.return) {
              const split = response_room.split('.');

              const room: IRoom = {
                lbl: split.splice(2, 5).join('.'),
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
                  expanded: false,
                };
                this.housesFound.push(house);
              }
            }
          } else {
            this.no_timeslot = true;
          }

          // sort elements for nicer display
          this.housesFound.sort(RoomplanPage.compareHouses);
          this.housesFound.forEach(function (house) {
            house.rooms.sort(RoomplanPage.compareRooms);
          });

          this.isLoaded = true;
          if (this.refresher) {
            this.refresher.target.complete();
          }
        },
        (error: HttpErrorResponse) => {
          this.error = error;
          this.housesFound = [];
          this.no_timeslot = true;
          this.isLoaded = true;
          if (this.refresher) {
            this.refresher.target.complete();
          }
        }
      );
  }
}
