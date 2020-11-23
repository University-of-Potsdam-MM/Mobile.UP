/* ~~~ EmergencyPage ~~~ */

import { InAppBrowserObject } from '@ionic-native/in-app-browser/ngx';
import * as geojson from 'geojson';
import { IDeviceInfo } from '../services/device/device.service';
import { ILoginConfig_Credentials, ILoginConfig_SSO, ILoginConfig_OIDC, ICredentials } from '../services/login-provider/interfaces';

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
    name:       string;
    contact:    Contact;
    description?: string;
    address?:   Address;
    expanded: boolean;
}


/* ~~~ PersonsPage ~~~ */

export interface IPerson {
  Id?: string;
  Last_Name?: string;
  First_Name?: string;
  Company_Name?: string;
  Department?: string;
  Full_Job_Title?: string;
  Email?: string;
  Email_2?: string;
  Email_3?: string;
  Extension?: string;
  Business_1?: string;
  Business_2?: string;
  Home?: string;
  Mobile?: string;
  Fax?: string;
  Pager?: string;
  User_Profile?: string;
  PIN?: string;
  User_Field_1?: string;
  User_Field_2?: string;
  User_Field_3?: string;
  Company_Section?: string;
  Location?: string;
  Title?: string;
  Initials?: string;
  Middle_Name?: string;
  Room_Name?: string;
  Cost_Centre?: string;
  Contact_Type?: string;
  Alternate_First_Names_List?: string;
  Alternate_Last_Names_List?: string;
  Address_Line_1?: string;
  Address_Line_2?: string;
  Address_Line_3?: string;
  Address_Line_4?: string;
  PostZip_Code?: string;
  Directory_Group?: string;
  Pickup_Extension?: string;
  Main_Extension_MAC_Address?: string;
  Keywords?: string;
  Contact_Information?: string;
  Absent_Message?: string;
}

/* ~~~ Mensa ~~~ */

export interface IMensaResponse {
  meal: IMeals[];
  campus: string;
  iconHashMap: IMensaIconMap;
}

export interface IMeals {
  order?: number;
  allergens?: IMensaAllergenes[];
  description?: string;
  type?: string[];
  prices?: IMensaPrices;
  date?: string;
  title?: string;
}

export interface IMensaAllergenes {
  description: string;
  descriptionType: string;
  longName: string;
  shortName: string;
  type: string;
}

export interface IMensaPrices {
  guest: number;
  staff: number;
  student: number;
}

export interface IMensaIconMap {
  entry: IMensaIcon[];
}

export interface IMensaIcon {
  key: string;
  value: string;
}
export interface ADS {
  uid:      number;
  art:      number;
  field:    string;
  title:    string;
  date:     number;
  file:     string;
  foreign:  string;
  firm:     string;
  location: string;
  street:   string;
  plz:      number;
  language: string;
  homepage: string;
  firstname: string;
  lastname: string;
  phone:    string;
  mail:     string;
  partner:  number;
  famFriendly: number;
  expanded:  boolean;
}

export interface IADSResponse extends Array<ADS> {}

/* ~~~ config ~~~ */

export interface IConfig {
  appVersion: string;
  urlAndroid: string;
  urlIOS: string;
  modules: {[moduleName: string]: IModule};
  authorization: ILoginConfig;
  webservices: IWebServices;
  policies: IPolicies;
  general: IGeneral;
  campus: ICampus[];
}

export interface IGeneral {
  tokenRefreshBoundary: number;
}

export interface IPolicies {
  impressumTemplateDE: string;
  impressumTemplateEN: string;
  tosTemplateDE: string;
  tosTemplateEN: string;
  privacyTemplateDE: string;
  privacyTemplateEN: string;
}

export interface IAppUrls {
  moodleAndroid: string;
  moodleIOS: string;
  moodleBundle: string;
  reflectAndroid: string;
  reflectIOS: string;
  reflectBundle: string;
}

// references interfaces coming from login-provider
export interface ILoginConfig {
  credentials?: ILoginConfig_Credentials;
  sso?: ILoginConfig_SSO;
  oidc?: ILoginConfig_OIDC;
  oidc_new?: ILoginConfig_OIDC;
}

export interface IBibSessionResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
  patron: string;
}

export interface IBibSession {
  credentials: ICredentials;
  token: string;
  oidcTokenObject: IBibSessionResponse;
  timestamp: Date;
}

export interface IModule {
  componentName: string;
  i18nKey?: string;
  icon: string;
  selected?: boolean;
  hide?: boolean;
  url?: string;
  additionalUrl?:string;
  appId?: string;
  urlAndroid?: string;
  urlIOS?: string;
  bundleName?: string;
  // needed for supporting gridster. Adding these properties makes a module
  // also a valid grid item.
  x: number;
  y: number;
  rows: number;
  cols: number;
}

export interface IWebServices {
  endpoint: {[name: string]: IEndpoint};
  apiToken: string;
  apiTokenNew: string;
  defaultCachingTTL: number;
  cacheGroupKeySuffix: string;
}

export interface IEndpoint {
  url: string;
  cachingTTL?: number;
  cacheGroupKey?: string;
  cachingEnabled?: boolean;
}

export interface IEndpoints {
  config: string;
  personSearch: string;
  mensa: string;
  practiceSearch: string;
  practiceJobPostings: string;
  news: string;
  roomsSearch: string;
  roomplanSearch: string;
  events: string;
  library: string;
  libraryDAIA: string;
  libraryPAIA: string;
  libraryLKZ: string;
  puls: string;
  maps: string;
  openingHours: string;
  emergencyCalls: string;
  logging: string;
  feedback: string;
  transport: string;
}

/* ~~~ NewsPage and EventsPage ~~~ */

export interface INewsApiResponse {
  passedArgs: string[];
  vars: INewsVars;
  errors: INewsErrors;
  message: string;
  url: string;
  action: string;
  controller: string;
  model: string;
  base: string;
  webroot: string;
  browser: INewsBrowser;
  here: string;
  hereRel: string;
  routeUrl: string;
}

export interface INewsVars {
  authUser: string;
  flashMessage: string;
  errors: INewsErrors;
  requestUrl: string;
  model: string;
  action: string;
  domain: string;
  webroot: string;
  request: INewsRequest;
  news?: INewsArticle[];
  newsSources?: INewsSources;
  requestMethod: string;
  browser: INewsBrowser;
  isAjax: boolean;
  loggedIn: boolean;
}

export interface IEventApiResponse {
  vars: IEventVars;
  errors: INewsErrors;
}

export interface IEventVars {
  events: INewsEventsObject[];
  places: INewsPlaces;
}

export interface INewsErrors {
  exist: boolean;
  inValidation: string[];
}

export interface INewsBrowser {
  name: string;
}

export interface INewsRequest {
  date: string;
}

export interface INewsArticle {
  News: INewsArticleInfo;
  NewsSource: INewsArticleSource;
}

export interface INewsSources {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  7: string;
}

export interface INewsArticleInfo {
  id: string;
  headline: string;
  description: string;
  text: string;
  link: string;
  source_id: string;
  time: string;
  DateString: string;
}

export interface INewsArticleSource {
  id: string;
  mapping: string;
  name: string;
  url: string;
  sourceType: string;
  rank: string;
}

export interface INewsEventsObject {
  Event: INewsEventsData;
  Place: INewsEventsPlace;
  Link?: string;
}

export interface INewsPlaces {
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
}

export interface INewsEventsData {
  id: string;
  eid: string;
  name: string;
  startTime: string;
  endTime: string;
  description: string;
  seen: string;
  place_id: string;
  lastChanged: string;
  pic: string;
  pic_square: string;
  pic_big: string;
  ticket_uri: string;
  sourceType: string;
  venue: string;
  DateString: string;
}

export interface INewsEventsPlace {
  id: string;
  name: string;
  mapping: string;
  lat: string;
  lng: string;
  adresse: string;
  plz: string;
  ort: string;
  fb_page_id: string;
  fb_user_id: string;
  fb_search: string;
  icalExportUrl: string;
  feed: string;
}

/* ~~~ RoomsPage and RoomplanPage ~~~ */

/** API mappings for rooms4Time request (RoomsPage) */
export interface IRoomApiRequest {
  browser?: InAppBrowserObject;
  authToken: string;
}
export interface IRoomRequestResponseReturn {
  return?: Array<string>;
}

export interface IRoomRequestResponse {
  rooms4TimeResponse?: IRoomRequestResponseReturn;
}


/** API mappings for reservations request (RoomplanPage) */
export interface IReservationRequestResponse {
  reservationsResponse?: IReservationRequestResponseReturn;
}

export interface IReservationRequestResponseReturn {
  return?: Array<IReservationRequestResponseDetail>;
}

export interface IReservationRequestResponseDetail {
  endTime?: Date;
  startTime?: Date;
  roomList?: IReservationRequestResponseRoomList;
  personList?: IReservationRequestResponsePersonList;
  veranstaltung?: string;
}

export interface IReservationRequestResponseRoomList {
  room: any;
}

export interface IReservationRequestResponsePersonList {
  person: Array<String>;
}

/** Local objects for app data structure */
export interface IHouse {
  lbl: string;
  rooms: Array<IRoom>;
  expanded: boolean;
}

export interface IHousePlan {
  lbl: string;
  rooms: Map<string, IRoom>;
  expanded: boolean;
}

export interface IRoom {
  lbl: string;
  events?: Array<IRoomEvent>;
  expanded?: boolean;
}

export interface IRoomEvent {
  lbl: string;
  persons: Array<String>;
  startTime: Date;
  endTime: Date;
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
  key: string;
  lbl?: string; // identifier of localized resource under page.settings.options.??
  info?: string; // same as lbl but for help text (shown as subtitle)
  value: any;
  icon?: string;
  options?: Array<ISettingOption>;
  type: ESettingType;
  mobileOnly?: boolean;
}

export interface ISettingOption {
  key: any;
}

export interface IStudieCourse {
  StgNr: string;
  abschl: string;
  dtxt: string;
  ltxt: string;
  stg: string;
  'stg.pversion': string;
  stgsem: string;
}

export interface IDeparture {
  JourneyDetailRef: IJourneyDetailRef;
  Product: IProduct;
  name: string;
  type: string;
  stop: string;
  stopid: string;
  stopExtId: string;
  prognosisType: string;
  time: string;
  date: string;
  rtTime: string;
  rtDate: string;
  direction: string;
  trainNumber: string;
  trainCategory: string;
}

export interface IJourneyDetailRef {
  ref: string;
}

export interface IProduct {
  name: string;
  num: string;
  line: string;
  catOut: string;
  catIn: string;
  catCode: string;
  catOutS: string;
  catOutL: string;
  operatorCode: string;
  operator: string;
  admin: string;
}

export interface IJourneyResponse {
  Departure: IDeparture[];
}

/* ~~~ CampusMap ~~~ */

export type ILatLongBounds = [number, number][];

export interface ICampus {
  name: string;
  location_id: string;
  pretty_name: string;
  canteen_name: string;
  shortcode: string;
  transport_station_id: string;
  coordinates: [number, number];
  lat_long_bounds: ILatLongBounds;
}

export interface IMapsResponseObject {
  campus: string;
  category: string;
  geo: geojson.FeatureCollection;
}

export type IMapsResponse = IMapsResponseObject[];

export interface IFeedback extends IDeviceInfo {
  rating?: string;
  description?: string;
  recommend?: string;
  uid?: string;
}

export interface IUBUser {
  name: string;
  email?: string;
  address?: string;
  expires?: string;
  status?: number;
  type?: string[];
  note?: string;
}

export interface IUBItems {
  doc: IUBItem[];
}

export interface IUBItem {
  status: number;
  item?: string;
  edition?: string;
  requested?: string;
  about?: string;
  label?: string;
  queue?: number;
  renewals?: number;
  reminder?: number;
  starttime?: string;
  endtime?: string;
  cancancel?: boolean;
  canrenew?: boolean;
  error?: string;
  condition?: any;
  storage?: string;
  storageid?: string;
}

export interface IUBFees {
  amount?: string;
  fee?: IUBFee[];
}

export interface IUBFee {
  amount: string;
  date?: string;
  about?: string;
  item?: string;
  edition?: string;
  feetype?: string;
  feeid?: string;
}
