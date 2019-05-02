import {Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {IConfig} from '../../lib/interfaces';
import {ConfigService} from '../config/config.service';
import {UserSessionService} from '../user-session/user-session.service';
import {Observable} from 'rxjs';
import {CacheService} from 'ionic-cache';
import {
  ICachingOptions,
  ILibraryRequestParams, IMensaRequestParams,
  IPersonsRequestParams,
  IRoomsRequestParams, ITransportRequestParams,
  IWebservice
} from './webservice-definition-interfaces';

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

/**
 * Service for bundling all http calls in one place.
 *
 * In {@link webservices} a webservice request can be defined. A definition consists
 * of three functions: 'buildRequest', 'responseCallback', 'errorCallback'.
 *
 * - buildRequest: This function *must* be defined as it is the function that actually
 *   builds the request. The parameters this function uses must be passed to the
 *   {@link call} function when it is called.
 *
 * - responseCallback: This function can optionally be defined to preprocess the
 *   webservices response before being returned to where the function was called.
 *   By default (see {@link defaults}) a function that just passes on the response
 *   is called, so in other words nothing will be done.
 *
 * - errorCallback: This function can optionally be defined to handle an error
 *   individually.
 *   By default (see {@link defaults}) the error is simply logged to console and
 *   an empty array is returned. In case other behaviour is desired you can define
 *   this function as you like it.
 */
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
    // by default in case of an error the error will be passed on
    errorCallback: (error, wsName) => {
      console.log(`[WebserviceWrapper]: Error when calling ${wsName}: ${error}`);
      return error;
    }
  };

  /**
   * Definition of the webservices that can be used in this application.
   *
   * TODO: I guess it would be better to write a class for each definition which
   * is implementing the IWebservice interface. That way we could have typing for
   * those functions. Can't think of an elegant way to do this, though.
   */
  public webservices: {[wsName: string]: IWebservice} = {
    maps: {
      buildRequest: (params, url) => {
        return this.http.get(
          url,
          {
            headers: this.apiTokenHeader
          }
        );
      }
    },
    mensa: {
      buildRequest: (params: IMensaRequestParams, url) => {
        return this.http.get(
          url,
          {
            headers: this.apiTokenHeader,
            params: {location: params.campus_canteen_name}
          }
        );
      }
    },
    personSearch: {
      buildRequest: (params: IPersonsRequestParams, url) => {
        return this.http.get(
          url + '/' + params.query,
          {
            headers: {
              Authorization: `${params.session.oidcTokenObject.token_type} ${params.session.oidcTokenObject.access_token}`
            }
          }
        );
      }
    },
    roomsSearch: {
      buildRequest: (params: IRoomsRequestParams, url) => {
        return this.http.get(
          url,
          {
            headers: this.apiTokenHeader,
            params: createRoomParams(params)
          }
        );
      }
    },
    roomPlanSearch: {
      buildRequest: (params: IRoomsRequestParams, url) => {
        return this.http.get(
          url,
          {
            headers: this.apiTokenHeader,
            params: createRoomParams(params)
          }
        );
      }
    },
    library: {
      buildRequest: (requestParams: ILibraryRequestParams, url) => {
        return this.http.get(
          this.config.webservices.endpoint.library.url,
          {
            headers: this.apiTokenHeader,
            params: {
              operation: 'searchRetrieve',
              query: requestParams.query,
              startRecord: requestParams.startRecord,
              maximumRecords: requestParams.maximumRecords,
              recordSchema: 'mods'
            },
            responseType: 'text'
          }
        );
      }
    },
    emergencyCalls: {
      buildRequest: (params, url) => {
        return this.http.get(
          url,
          {headers: this.apiTokenHeader}
        );
      }
    },
    openingHours: {
      buildRequest: (params, url) => {
        return this.http.get(
          url,
          { headers: this.apiTokenHeader }
        );
      }
    },
    transport: {
      buildRequest: (params: ITransportRequestParams, url) => {
        return this.http.get(
          url,
          {
            headers: this.apiTokenHeader,
            params: {
              maxJourneys: params.maxJourneys,
              format: 'json',
              time: params.time,
              id: params.campus.transport_station_id
            }
          }
        );
      }
    }

  };

  constructor(private http: HttpClient,
              private cache: CacheService,
              private session: UserSessionService) {}


  /**
   * returns a webservice definition and sets default values for a webservice
   * definitions attributes that are undefined. If the webservice is not known,
   * an error will the thrown.
   * @param name {string} Name of the webservice to be returned
   */
  private getDefinition(name: string) {
    if (!this.webservices.hasOwnProperty(name)) {
      throw new Error(`[WebserviceWrapper]: No webservice named ${name} defined`);
    }
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
   * @param cachingOptions {ICachingOptions} Defines whether the call should be cached, default is true
   */
  public call(webserviceName: string,
              params = {},
              cachingOptions: ICachingOptions = {cache: true}) {

    // first prepare the webservice definition by adding default values if possible
    const ws = this.getDefinition(webserviceName);

    // create the request by calling the defined buildRequest function
    const request = ws.buildRequest(
      params,
      this.config.webservices.endpoint[webserviceName].url
    );

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

    if (cachingOptions.cache) {
      // if desired we're caching the response. By default it is desired.
      // If options are given in cachingOptions these options will be used, otherwise:
      // - key = name of the webservice plus base64 encoding of the used parameters. This way
      //         identical requests can be cached easily
      // - groupKey = name of the webservice plus "Group", e.g. 'library' -> 'libraryGroup'
      // - ttl = ttl in config or default ttl
      return this.cache.loadFromObservable(
        cachingOptions.key || webserviceName + (cachingOptions ? ':' + btoa(JSON.stringify(params)) : ''),
        wrapperObservable,
        cachingOptions.groupKey || webserviceName + 'Group',
        cachingOptions.ttl || this.config.webservices.endpoint[webserviceName].cachingTTL || null
      );
    }

    // if caching was not desired we just return the observable itself
    return wrapperObservable;
  }
}
