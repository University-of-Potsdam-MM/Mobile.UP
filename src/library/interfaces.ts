/* ~~~ EmergencyPage ~~~ */

import { IAuthorization } from "../providers/login-provider/interfaces";
import {InAppBrowserObject} from "@ionic-native/in-app-browser";

/**
 * Interface for a contact with telephone number and email address
 */
export interface Contact {
    telephone:  string;
    mail?:      string;
}

/**
 * Interface for an address consisting og postal zip code and street
 */
export interface Address {
    postal:     string;
    street:     string;
}

/**
 * Interface for a single EmergencyCall entry
 * An EmergencyCall always has a 'name:string' and a 'telephone:string', any
 * other attribute is optional.
 */
export interface EmergencyCall {
    name:       string,
    contact:    Contact,
    address?:   Address
}


/* ~~~ PersonsPage ~~~ */

export interface IPersonSearchResponse {
  timer:Array<string>;
  people:IPersonWrapper[];
}

export interface IPersonWrapper {
  Person:IPerson
}

export interface IPerson {
  id?:string;
  Abteilung?:string;
  Email?:string;
  Fax?:number,
  Nachname?:string;
  Namenszusatz?:string;
  Raum?:string;
  show_only_altPhone?:string;
  Struktureinheiten?:string;
  Suchbegriffe?:string;
  Telefon?:string;
  Vorname?:string;
  zweitesTelefon?:string;
  PCFax?:string;
  gueltigbis?:string;
  Titel?:string;
  Email_Langform?:string;
}

/* ~~~ config ~~~ */

export interface IConfig {
  authorization:IAuthorization; // comes from login-provider
  webservices:IWebServices
}

export interface IWebServices {
  endpoint:IEndpoints;
  apiToken:string;
}

export interface IEndpoints {
  personSearch:string;
  roomsSearch:string;
  roomplanSearch:string;
}

/* ~~~ RoomsPage and RoomplanPage ~~~ */

/** API mappings for rooms4Time request (RoomsPage) */
export interface IRoomApiRequest {
  browser?:InAppBrowserObject,
  authToken:string
}
export interface IRoomRequestResponseReturn {
  return?:Array<string>;
}

export interface IRoomRequestResponse {
  rooms4TimeResponse?:IRoomRequestResponseReturn;
}


/** API mappings for reservations request (RoomplanPage) */
export interface IReservationRequestResponse {
  reservationsResponse?:IReservationRequestResponseReturn;
}

export interface IReservationRequestResponseReturn {
  return?:Array<IReservationRequestResponseDetail>;
}

export interface IReservationRequestResponseDetail {
  endTime?:Date;
  startTime?:Date;
  roomList?:IReservationRequestResponseRoomList;
  personList?:IReservationRequestResponsePersonList;
  veranstaltung?:string;
}

export interface IReservationRequestResponseRoomList {
  room:any
}

export interface IReservationRequestResponsePersonList {
  person:Array<String>;
}

/** Local objects for app data structure */
export interface IHouse {
  lbl:string;
  rooms:Array<IRoom>;
  expanded:boolean;
}

export interface IHousePlan {
  lbl:string;
  rooms:Map<string, IRoom>;
  expanded:boolean;
}

export interface IRoom {
  lbl:string;
  events?:Array<IRoomEvent>;
  expanded?:boolean;
}

export interface IRoomEvent {
  lbl:string;
  persons:Array<String>;
  startTime:Date;
  endTime:Date;
}

/* ~~~ Settings ~~~ */
export enum ESettingType {
  boolean,
  string,
  number
}

export interface ISetting {
  key:string;
  lbl:string; // identifier of localized resource under page.settings.options.??
  value:any;
  type:ESettingType;
}

