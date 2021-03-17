import { Component, ViewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AlertService } from 'src/app/services/alert/alert.service';
import {
  IHouse,
  IRoom,
  IHousePlan,
  IRoomEvent,
  IReservationRequestResponse,
  ICampus,
} from 'src/app/lib/interfaces';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from 'src/app/services/webservice-wrapper/webservice-wrapper.service';
import { IRoomsRequestParams } from '../../services/webservice-wrapper/webservice-definition-interfaces';
import { CampusTabComponent } from '../../components/campus-tab/campus-tab.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-roomplan',
  templateUrl: './roomplan.page.html',
  styleUrls: ['./roomplan.page.scss'],
})
export class RoomplanPage extends AbstractPage {
  @ViewChild(CampusTabComponent, { static: false })

  // params
  default_house: IHouse;
  default_room: IRoom;

  // bindings
  refresher: any;
  isLoaded;

  // vars
  houseMap: Map<string, IHousePlan> = new Map<string, IHousePlan>();
  housesFound: Array<IHouse> = [];
  day_offset: string;
  response: any;
  current_location: ICampus;
  error: HttpErrorResponse;
  requestProcessed = false;

  campusTabComponent: CampusTabComponent;

  constructor(
    private alertService: AlertService,
    private ws: WebserviceWrapperService,
    public translate: TranslateService // used in template
  ) {
    super({ optionalNetwork: true });
  }

  /**
   * Comparator for event sorting
   *
   * @param {IRoomEvent} a
   * @param {IRoomEvent} b
   * @returns {number}
   */
  static compareEvents(a: IRoomEvent, b: IRoomEvent) {
    if (a.startTime < b.startTime) {
      return -1;
    }
    if (a.startTime > b.startTime) {
      return 1;
    }
    return 0;
  }

  /**
   * Comparator for room sorting
   *
   * @param {IRoomEvent} a
   * @param {IRoomEvent} b
   * @returns {number}
   */
  static compareRooms(a: IRoom, b: IRoom) {
    if (a.lbl < b.lbl) {
      return -1;
    }
    if (a.lbl > b.lbl) {
      return 1;
    }
    return 0;
  }

  /**
   * Comparator for house
   *
   * @param {IRoomEvent} a
   * @param {IRoomEvent} b
   * @returns {number}
   */
  static compareHouses(a: IHouse, b: IHouse) {
    if (a.lbl < b.lbl) {
      return -1;
    }
    if (a.lbl > b.lbl) {
      return 1;
    }
    return 0;
  }

  /**
   * Changes the day for which to load data
   * Day comes from DOM select element "select_day"
   */
  changeDay(newDay) {
    this.day_offset = newDay;

    this.housesFound = [];
    this.houseMap = new Map<string, IHousePlan>();
    // reset defaults so they don't open on new day
    this.default_room = null;
    this.default_house = null;

    if (this.current_location) {
      this.getRoomInfo();
    }
  }

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
   * @param location - number as string representing campus
   */
  switchLocation(campus: ICampus) {
    this.houseMap = new Map<string, IHousePlan>();
    this.housesFound = [];
    this.current_location = campus;
    this.getRoomInfo();
  }

  /**
   * Expand house expandable to show rooms
   * Closes rooms when house is closed
   *
   * @param house - lbl of house to close
   */
  public expandHouse(house) {
    for (const foundHouse of this.housesFound) {
      if (foundHouse.lbl === house) {
        foundHouse.expanded = !foundHouse.expanded;
      }
      if (foundHouse.expanded === false) {
        foundHouse.rooms.forEach(function (room) {
          room.expanded = false;
        });
      }
    }
  }

  /**
   * Expand room expandable to show events
   *
   * @param house - lbl of house to close
   * @param room - lbl of room to close
   */
  public expandRoom(house, room) {
    for (const foundHouse of this.housesFound) {
      if (foundHouse.lbl === house) {
        for (const foundRoom of foundHouse.rooms) {
          if (foundRoom.lbl === room) {
            foundRoom.expanded = !foundRoom.expanded;
          }
        }
      }
    }
  }

  /**
   * Adds a room to a house (specified by its lbl)
   * If the house does not exist one is created
   * Room is only added if house does not already have that room (identified by lbl)
   *
   * @param houseLbl - lbl of house to add room for
   * @param {IRoom} room - room to add to house
   */
  addRoomToHouse(houseLbl, room: IRoom) {
    let house: IHousePlan;
    if (this.houseMap && this.houseMap.has(houseLbl)) {
      house = this.houseMap.get(houseLbl);
    } else {
      house = {
        lbl: houseLbl,
        rooms: new Map<string, IRoom>(),
        expanded: false,
      };
    }

    if (house.rooms.has(room.lbl) === false) {
      house.rooms.set(room.lbl, room);
      this.houseMap.set(houseLbl, house);
    }
  }

  /**
   * Main function to query api and build array that is later parsed to DOM
   * Gets all its parameters from pages global vars (location, day, default house/room)
   *
   * @returns {Promise<void>}
   */
  getRoomInfo() {
    this.requestProcessed = false;

    const startSlot = new Date();
    const endSlot = new Date();
    startSlot.setHours(8);
    endSlot.setHours(22);
    startSlot.setDate(startSlot.getDate() + +this.day_offset); // unary plus for string->num conversion
    endSlot.setDate(endSlot.getDate() + +this.day_offset);

    this.ws
      .call('roomPlanSearch', {
        campus: this.current_location,
        timeSlot: { start: startSlot, end: endSlot },
      } as IRoomsRequestParams)
      .subscribe(
        (response: IReservationRequestResponse) => {
          this.houseMap = new Map<string, IHousePlan>();
          this.housesFound = [];
          this.error = null;

          if (
            response &&
            response.reservationsResponse &&
            response.reservationsResponse.return
          ) {
            for (const reservation of response.reservationsResponse.return) {
              // API often returns basically empty reservations, we want to ignore these
              if (
                reservation.veranstaltung !== '' &&
                reservation.veranstaltung != null
              ) {
                if (reservation.roomList.room instanceof Array === false) {
                  reservation.roomList.room = [reservation.roomList.room];
                }

                const roomList = reservation.roomList.room as Array<string>;
                for (const roomIterate of roomList) {
                  const split = roomIterate.split('.');
                  const room: IRoom = {
                    lbl: split.splice(2, 5).join('.'),
                    events: [],
                    expanded: false,
                  };

                  this.addRoomToHouse(split[1], room);

                  let people: Array<string> = [];
                  const personArray = reservation.personList.person;
                  for (let h = 0; h < personArray.length; h = h + 2) {
                    if (personArray[h] === 'N.N') {
                      people.push('N.N ');
                    }
                    if (personArray[h] !== '' && personArray[h + 1] !== '') {
                      people.push(
                        personArray[h + 1].trim() + ' ' + personArray[h].trim()
                      );
                    }
                  }

                  people = people.filter(this.uniqueFilter);

                  const event: IRoomEvent = {
                    lbl: reservation.veranstaltung,
                    startTime: new Date(reservation.startTime),
                    endTime: new Date(reservation.endTime),
                    persons: people,
                  };

                  if (
                    this.houseMap &&
                    split &&
                    split[1] &&
                    this.houseMap.has(split[1]) &&
                    this.houseMap.get(split[1]).rooms.has(room.lbl) &&
                    this.houseMap.get(split[1]).rooms.get(room.lbl).events
                  ) {
                    this.houseMap
                      .get(split[1])
                      .rooms.get(room.lbl)
                      .events.push(event);
                  }
                }
              }
            }

            // load defaults if they are passed to the page by other files
            let default_error = '';
            if (this.default_house != null) {
              if (this.houseMap && this.houseMap.has(this.default_house.lbl)) {
                this.houseMap.get(this.default_house.lbl).expanded = true;

                if (this.default_room != null) {
                  if (
                    this.houseMap
                      .get(this.default_house.lbl)
                      .rooms.has(this.default_room.lbl)
                  ) {
                    this.houseMap
                      .get(this.default_house.lbl)
                      .rooms.get(this.default_room.lbl).expanded = true;
                  } else {
                    default_error = 'page.roomplan.no_room';
                  }
                }
              } else {
                default_error = 'page.roomplan.no_house';
              }
            }

            if (default_error !== '') {
              this.alertService.showToast(default_error);
            }

            // sadly templates cannot parse maps,
            // therefore we will generate a new data structure based on arrays and parse everything into there
            const tmpHouseList = Array.from(this.houseMap.values());
            for (const house of tmpHouseList) {
              const tmpRoomArray = Array.from(house.rooms.values());

              tmpRoomArray.sort(RoomplanPage.compareRooms);
              for (const tmpRoom of tmpRoomArray) {
                tmpRoom.events.sort(RoomplanPage.compareEvents);
              }

              const tmpHouse: IHouse = {
                lbl: house.lbl,
                rooms: tmpRoomArray,
                expanded: house.expanded,
              };
              this.housesFound.push(tmpHouse);
            }
            this.housesFound.sort(RoomplanPage.compareHouses);
          }

          this.requestProcessed = true;
          this.isLoaded = true;
          // if refresher is running complete it
          if (this.refresher) {
            this.refresher.target.complete();
          }
        },
        (error: HttpErrorResponse) => {
          // if error reset vars and set error variable for display
          this.requestProcessed = true;
          this.error = error;
          this.houseMap = new Map<string, IHousePlan>();
          this.housesFound = [];
          this.isLoaded = true;
          if (this.refresher) {
            this.refresher.target.complete();
          }
        }
      );
  }

  /**
   * Filter for person array uniqueness
   *
   * @param value
   * @param index
   * @param self
   * @returns {boolean}
   */
  uniqueFilter(value, index, self) {
    return self.indexOf(value) === index;
  }
}
