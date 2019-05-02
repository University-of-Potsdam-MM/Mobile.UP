import {ICampus} from '../../lib/interfaces';
import {Observable} from 'rxjs';
import {ISession} from '../login-provider/interfaces';

/**
 * Defines a webservice in a more or less standardized way
 */
export interface IWebservice {
  /**
   * function that will be called to build the http request. The result must
   * be an Observable.
   * @param args
   */
  buildRequest: (params: any, url: string) => Observable<any>;
  /**
   * function that will be used as callback function for the http requests response
   * callback.
   * By default this function will just return the http requests response.
   * This function can be defined to preprocess the response and return something
   * that the corresponding page can use directly
   * @param response
   */
  responseCallback?: (response: any) => any;
  /**
   * function that will be used as callback function for the http requests error
   * callback.
   * By default this function will just log the error and return an empty array
   * because that is something that can easily be checked.
   * @param error
   */
  errorCallback?: (error: any) => any;
}

export interface ICachingOptions {
  cache: boolean;
  ttl?: number;
  key?: string;
  groupKey?: string;
}

/**
 * Defines a timeslot for use in web service calls
 */
export interface ITimeSlot {
  start: Date;
  end: Date;
}

/**
 * Parameters needed to create a request to the rooms API. With queryType you can
 * specify which endpoint should be queried. 'free' will query rooms4time, 'booked'
 * will query roomsReservations
 */
export interface IRoomsRequestParams {
  campus: ICampus;
  timeSlot: ITimeSlot;
}

/**
 * Parameters for querying the library API
 */
export interface ILibraryRequestParams {
  query: string;
  startRecord: string;
  maximumRecords: string;
}

/**
 * Parameters for querying the persons API
 */
export interface IPersonsRequestParams {
  query: string;
  session: ISession;
}

export interface ITransportRequestParams {
  time: string;
  maxJourneys: string;
  campus: ICampus;
}

export interface IMensaRequestParams {
  campus_canteen_name: string;
}
