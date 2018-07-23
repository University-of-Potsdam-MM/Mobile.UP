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
  expanded?:boolean;
}

export interface ADS {
  uid:      number,
  art:      number,
  field:    string,
  title:    string,
  date:     number,
  file:     string,
  foreign:  number,
  firm:     number,
  location: string,
  street:   string,
  plz:      number,
  language: string,
  homepage: string,
  firstname:string,
  lastname: string,
  phone:    string,
  mail:     string,
  partner:  number,
  famFriendly:number,
  expanded:  boolean
}

export interface IADSResponse extends Array<ADS>{}

/* ~~~ config ~~~ */

export interface IConfig {
  modules:{[moduleName:string]:IModule};
  authorization:IAuthorization; // comes from login-provider
  webservices:IWebServices
}

export interface IModule {
  componentName:string;
  i18nKey?:string;
  icon:string;
  selected?:boolean;
}

export interface IWebServices {
  endpoint:IEndpoints;
  apiToken:string;
}

export interface IEndpoints {
  personSearch:string;
  practiceSearch: string;
  news:string;
  roomsSearch:string;
  roomplanSearch:string;
  events:string;
}

/* ~~~ NewsPage and EventsPage ~~~ */

export interface INewsApiResponse {
  passedArgs:string[],
  vars:INewsVars,
  errors:INewsErrors,
  message: string,
  url:string,
  action:string,
  controller:string,
  model:string,
  base:string,
  webroot:string,
  browser:INewsBrowser,
  here:string,
  hereRel:string,
  routeUrl:string
}

export interface INewsVars {
  authUser:string,
  flashMessage:string,
  errors:INewsErrors,
  requestUrl:string,
  model:string,
  action:string,
  domain:string,
  webroot:string,
  request:INewsRequest,
  news?:INewsArticle[],
  newsSources?:INewsSources,
  events?:INewsEventsObject[],
  places?:INewsPlaces,
  requestMethod:string,
  browser:INewsBrowser,
  isAjax:boolean,
  loggedIn:boolean
}

export interface INewsErrors {
  exist:boolean,
  inValidation:string[]
}

export interface INewsBrowser {
  name:string
}

export interface INewsRequest {
  date:string
}

export interface INewsArticle {
  News:INewsArticleInfo,
  NewsSource:INewsArticleSource
}

export interface INewsSources {
  0:string,
  1:string,
  2:string,
  3:string,
  4:string,
  5:string,
  6:string,
  7:string
}

export interface INewsArticleInfo {
  id:string,
  headline:string,
  description:string,
  text:string,
  link:string,
  source_id:string,
  time:string,
  DateString:string
}

export interface INewsArticleSource {
  id:string,
  mapping:string,
  name:string,
  url:string,
  sourceType:string,
  rank:string
}

export interface INewsEventsObject {
  Event:INewsEventsData,
  Place:INewsEventsPlace,
  Link:string
}

export interface INewsPlaces {
  1:string,
  2:string,
  3:string,
  4:string,
  5:string,
  6:string,
  7:string,
  8:string,
  9:string,
  10:string,
  11:string,
  12:string
}

export interface INewsEventsData {
  id:string,
  eid:string,
  name:string,
  startTime:string,
  endTime:string,
  description:string,
  seen:string,
  place_id:string,
  lastChanged:string,
  pic:string,
  pic_square:string,
  pic_big:string,
  ticket_uri:string,
  sourceType:string,
  venue:string,
  DateString:string
}

export interface INewsEventsPlace {
  id:string,
  name:string,
  mapping:string,
  lat:string,
  lng:string,
  adresse:string,
  plz:string,
  ort:string,
  fb_page_id:string,
  fb_user_id:string,
  fb_search:string,
  icalExportUrl:string,
  feed:string,
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
  number,
  number_radio,
  string_radio,
  checkbox,
  placeholder
}

export interface ISetting {
  key:string;
  lbl?:string; // identifier of localized resource under page.settings.options.??
  info?:string; // same as lbl but for help text (shown as subtitle)
  value:any;
  options?:Array<ISettingOption>;
  type:ESettingType;
}

export interface ISettingOption {
  key:any;
  lbl:string;
}
