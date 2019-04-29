import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ICampus, IConfig} from '../../lib/interfaces';
import {ConfigService} from '../config/config.service';
import {UserSessionService} from '../user-session/user-session.service';
import {Observable} from 'rxjs';
import {CacheService} from 'ionic-cache';

/**
 * Defines a webservice in a more or less standardized way
 */
export interface IWebservice {
  /**
   * function that will be called to build the http request. The result must
   * be an Observable
   * @param args
   */
  buildRequest: (...args: any[]) => Observable<any>;
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

export interface ITimeSlot {
  start: Date;
  end: Date;
}

export interface IRoomsRequestParams {
  campus: ICampus;
  timeSlot: ITimeSlot;
}

/**
 * creates the httpParams for a request to the rooms api
 * @param params {IRoomsRequestParams} Params to build the request with
 */
function createRoomParams(params: IRoomsRequestParams) {
  return {
    format: 'json',
    startTime: params.timeSlot.start.toISOString(),
    endTime: params.timeSlot.end.toISOString(),
    campus: params.campus.location_id
  };
}

@Injectable({
  providedIn: 'root'
})
export class WebserviceWrapperService {

  private config: IConfig = ConfigService.config;

  /**
   * oftenly used header, can be used in buildRequest functions
   */
  private apiTokenHeader = {Authorization: this.config.webservices.apiToken};

  /**
   * default values for webservice definitions. Will be assigned in {@link getDefinition}
   * if not set
   */
  private defaults = {
    // by default the response will be passed on
    responseCallback: (response: any) => {
      return response;
    },
    // by default in case of an error an empty array will be returned and a
    // message is logged
    errorCallback: (error, wsName) => {
      console.log(`[Webservice]: Error when calling ${wsName}: ${error}`);
      return [];
    }
  };

  /**
   * Definition of the webservices that can be used in this application.
   */
  private webservices: {[wsName: string]: IWebservice} = {
    maps: {
      buildRequest: () => {
        return this.http.get(
          this.config.webservices.endpoint.maps,
          {
            headers: this.apiTokenHeader
          }
        );
      }
    },
    mensa: {
      buildRequest: (location: string) => {
        return this.http.get(
          this.config.webservices.endpoint.mensa,
          {
            headers: this.apiTokenHeader,
            params: {location: location}
          }
        );
      }
    },
    persons: {
      buildRequest: (query: string) => {
        return this.http.get(
          this.config.webservices.endpoint.personSearch + query,
          {
            headers: this.apiTokenHeader
          }
        );
      }
    },
    roomsFree: {
      buildRequest: (params: IRoomsRequestParams) => {
        return this.http.get(
          this.config.webservices.endpoint.roomsSearch,
          {
            headers: this.apiTokenHeader,
            params: createRoomParams(params)
          }
        );
      }
    },
    roomsBooked: {
      buildRequest: (params: IRoomsRequestParams) => {
        return this.http.get(
          this.config.webservices.endpoint.roomplanSearch,
          {
            headers: this.apiTokenHeader,
            params: createRoomParams(params)
          }
        );
      }
    }
  };

  constructor(private http: HttpClient,
              private cache: CacheService,
              private session: UserSessionService) {  }


  /**
   * returns a webservice definition and sets default values for a webservice
   * definitions attributes that are undefined
   * @param name {string} Name of the webservice to be returned
   */
  private getDefinition(name: string) {
    const ws = this.webservices[name];
    for (const k in this.defaults) {
      if (!ws.hasOwnProperty(k)) {
        ws[k] = this.defaults[k];
      }
    }
    return ws;
  }

  /**
   * executes the specified call
   * @param webserviceName {string} The name of the service to be called
   * @param params {any} Additional params that will be given to the call building function
   * @param cache {boolean} Defines whether the call should be cached, default is true
   */
  public call(webserviceName: string,
              params = {},
              cache = true) {

    // first prepare the webservice definition by adding default values if possible
    const ws = this.getDefinition(webserviceName);

    // create the request by calling the defined buildRequest function
    const request = ws.buildRequest(params);

    // now create a wrapping Observable around the request and attach the defined
    // callbacks to it
    const wrapperObservable = new Observable(
      observer => {
        request.subscribe(
          response => {
            observer.next(ws.responseCallback(response));
            observer.complete();
          },
          error => {
            observer.error(ws.errorCallback(error));
          }
        );
      }
    );

    if (cache) {
      // if desired we're caching the response. The name of the request plus the used
      // parameters in base64 will be used as key
      return this.cache.loadFromObservable(
        webserviceName + ':' + btoa(JSON.stringify(params)),
        wrapperObservable
      );
    }

    // if caching was not desired we just return the observable itself
    return wrapperObservable;
  }
}
