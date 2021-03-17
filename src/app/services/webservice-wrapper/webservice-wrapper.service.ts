/* eslint-disable @typescript-eslint/member-ordering */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ConfigService } from '../config/config.service';
import { from, Observable } from 'rxjs';
import {
  ICachingOptions,
  ILibraryRequestParams,
  IMensaRequestParams,
  IPersonsRequestParams,
  IRoomsRequestParams,
  ITransportRequestParams,
  IWebservice,
} from './webservice-definition-interfaces';
import { IPulsAPIResponse_getLectureScheduleRoot } from '../../lib/interfaces_PULS';
import { AlertService } from '../alert/alert.service';
import { isEmptyObject } from '../../lib/util';
import { switchMap } from 'rxjs/operators';
// import { Logger, LoggingService } from 'ionic-logging-service';
import { ConnectionService } from '../connection/connection.service';
import * as moment from 'moment';
import { Storage } from '@capacitor/storage';
import { CacheService } from 'ionic-cache';

/**
 * creates the httpParams for a request to the rooms api
 *
 * @param params {IRoomsRequestParams} Params to build the request with
 */
function createRoomParams(params: IRoomsRequestParams) {
  return {
    format: 'json',
    startTime: params.timeSlot.start.toISOString(),
    endTime: params.timeSlot.end.toISOString(),
    campus: params.campus.location_id,
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
 *   passed on.
 *
 * This service also supports caching. Caching is enabled for every endpoint by
 * default, if it should be disabled set 'cachingEnabled' to false in the endpoint
 * definition.
 * When calling a webservice an optional object for caching options can be used.
 * In this object you can manually set some caching parameters and make the request
 * remove any cached items before execution by using:
 *  - 'forceRefresh': will remove item with same cacheItemKey
 *  - 'forceRefreshGroup': will remove all items with same cacheGroupKey
 *
 * Usage examples:
 *
 * @example
 * // without parameters
 * this.webserviceWrapper.call('maps')
 *
 * // with parameters
 * this.webserviceWrapper.call('mensa', {campus_canteen_name: 'NeuesPalais'})
 *
 * // will get a new element because forceRefresh is set to true
 * this.webserviceWrapper.call(
 *    'mensa',
 *    {campus_canteen_name: 'NeuesPalais'},
 *    {forceRefresh: true}
 * )
 *
 * // will remove any cached mensa request because forceRefrehGroup is set to true
 * this.webserviceWrapper.call(
 *    'mensa',
 *    {campus_canteen_name: 'NeuesPalais'},
 *    {forceRefreshGroup: true}
 * )
 */
@Injectable({
  providedIn: 'root',
})
export class WebserviceWrapperService {
  /**
   * oftenly used header, can be used in buildRequest functions
   */
  private apiTokenHeader = {
    Authorization: ConfigService.config.webservices.apiToken,
  };
  private apiTokenHeaderNew = {
    apikey: ConfigService.config.webservices.apiTokenNew,
  };

  private pulsHeaders = {
    'Content-Type': 'application/json',
    Authorization: ConfigService.config.webservices.apiToken,
  };

  private pulsHeadersNew = {
    'Content-Type': 'application/json',
    apikey: ConfigService.config.webservices.apiTokenNew,
  };

  /**
   * default values for webservice definitions. Will be assigned in {@link getDefinition}
   * if not set
   */
  private defaults = {
    // by default the response will be passed on
    responseCallback: (
      response: any,
      wsName,
      usingUpdatedApiManager: boolean
    ) => {
      const stringResponse = JSON.stringify(response);
      if (stringResponse.length > 30000) {
        // this.logger.debug(
        //   'responseCallback',
        //   `calling '${wsName}': `,
        //   stringResponse.substring(0, 30000)
        // );
        // this.logger.debug('USING NEW API MANAGER: ' + usingUpdatedApiManager);
      } else {
        // this.logger.debug(
        //   'responseCallback',
        //   `calling '${wsName}': `,
        //   response
        // );
        // this.logger.debug('USING NEW API MANAGER: ' + usingUpdatedApiManager);
      }
      return response;
    },
    // by default in case of an error the error will be passed on
    errorCallback: async (error, wsName, usingUpdatedApiManager) => {
      // this.logger.error('errorCallback', `calling '${wsName}': `, error);
      // this.logger.error('USING NEW API MANAGER: ' + usingUpdatedApiManager);
      await Storage.set({
        key: 'latestWebserviceError',
        value: JSON.stringify(error),
      });

      return error;
    },
  };

  /**
   * Definition of the webservices that can be used in this application.
   *
   * TODO: I guess it would be better to write a class for each definition which
   * is implementing the IWebservice interface. That way we could have typing for
   * those functions. Can't think of an elegant way to do this, though.
   */
  public webservices: { [wsName: string]: IWebservice } = {
    maps: {
      buildRequest: (params, url) =>
        this.http.get(url, {
          headers: ConfigService.isApiManagerUpdated
            ? this.apiTokenHeaderNew
            : this.apiTokenHeader,
        }),
    },
    mensa: {
      buildRequest: (params: IMensaRequestParams, url) =>
        this.http.get(url, {
          headers: ConfigService.isApiManagerUpdated
            ? this.apiTokenHeaderNew
            : this.apiTokenHeader,
          params: { location: params.campus_canteen_name },
        }),
    },
    personSearch: {
      buildRequest: (params: IPersonsRequestParams, url) =>
        this.http.get(url + '/' + params.query, {
          headers: {
            Authorization: `${params.session.oidcTokenObject.token_type} ${params.session.oidcTokenObject.access_token}`,
          },
        }),
    },
    roomsSearch: {
      buildRequest: (params: IRoomsRequestParams, url) =>
        this.http.get(url, {
          headers: ConfigService.isApiManagerUpdated
            ? this.apiTokenHeaderNew
            : this.apiTokenHeader,
          params: createRoomParams(params),
        }),
    },
    roomPlanSearch: {
      buildRequest: (params: IRoomsRequestParams, url) =>
        this.http.get(url, {
          headers: ConfigService.isApiManagerUpdated
            ? this.apiTokenHeaderNew
            : this.apiTokenHeader,
          params: createRoomParams(params),
        }),
    },
    library: {
      buildRequest: (requestParams: ILibraryRequestParams, url) =>
        this.http.get(url, {
          headers: ConfigService.isApiManagerUpdated
            ? this.apiTokenHeaderNew
            : this.apiTokenHeader,
          params: {
            operation: 'searchRetrieve',
            query: requestParams.query,
            startRecord: requestParams.startRecord,
            maximumRecords: requestParams.maximumRecords,
            recordSchema: 'mods',
          },
          responseType: 'text',
        }),
    },
    libraryDAIA: {
      buildRequest: (params, url) =>
        this.http.get(url, {
          headers: ConfigService.isApiManagerUpdated
            ? this.apiTokenHeaderNew
            : this.apiTokenHeader,
          params: {
            id: params.id,
            format: 'json',
          },
        }),
    },
    libraryLKZ: {
      buildRequest: (params, url) =>
        this.http.get(url, { params: { epn: params.epn } }),
    },
    emergencyCalls: {
      buildRequest: (params, url) =>
        this.http.get(url, {
          headers: ConfigService.isApiManagerUpdated
            ? this.apiTokenHeaderNew
            : this.apiTokenHeader,
        }),
    },
    openingHours: {
      buildRequest: (params, url) =>
        this.http.get(url, {
          headers: ConfigService.isApiManagerUpdated
            ? this.apiTokenHeaderNew
            : this.apiTokenHeader,
        }),
    },
    transport: {
      buildRequest: (params: ITransportRequestParams, url) =>
        this.http.get(url, {
          headers: ConfigService.isApiManagerUpdated
            ? this.apiTokenHeaderNew
            : this.apiTokenHeader,
          params: {
            maxJourneys: params.maxJourneys,
            format: 'json',
            time: params.time,
            id: params.campus.transport_station_id,
          },
        }),
    },
    practiceSearch: {
      buildRequest: (params, url) =>
        this.http.get(url, {
          headers: ConfigService.isApiManagerUpdated
            ? this.apiTokenHeaderNew
            : this.apiTokenHeader,
        }),
    },
    news: {
      buildRequest: (params, url) =>
        this.http.get(url, {
          headers: ConfigService.isApiManagerUpdated
            ? this.apiTokenHeaderNew
            : this.apiTokenHeader,
        }),
    },
    events: {
      buildRequest: (params, url) => {
        url += moment().unix();
        return this.http.get(url, {
          headers: ConfigService.isApiManagerUpdated
            ? this.apiTokenHeaderNew
            : this.apiTokenHeader,
        });
      },
    },
    logging: {
      buildRequest: (errorObject, url) =>
        this.http.post(url, {
          headers: ConfigService.isApiManagerUpdated
            ? this.apiTokenHeaderNew
            : this.apiTokenHeader,
          params: errorObject,
        }),
    },
    feedback: {
      buildRequest: (request, url) =>
        this.http.post(url, request, {
          headers: ConfigService.isApiManagerUpdated
            ? this.pulsHeadersNew
            : this.pulsHeaders,
        }),
    },
    nominatim: {
      buildRequest: (params, url) => {
        let lat = '';
        let lon = '';
        if (
          ConfigService.config &&
          ConfigService.config.campus &&
          ConfigService.config.campus[0] &&
          ConfigService.config.campus[0].coordinates &&
          ConfigService.config.campus[0].coordinates[0] &&
          ConfigService.config.campus[0].coordinates[1]
        ) {
          lat = ConfigService.config.campus[0].coordinates[0].toString();
          lon = ConfigService.config.campus[0].coordinates[1].toString();
        }
        return this.http.get(url, {
          params: {
            format: 'jsonv2',
            lat,
            lon,
          },
        });
      },
    },
    // PULS webservices
    pulsGetLectureScheduleRoot: {
      buildRequest: (_, url) =>
        this.http.post<IPulsAPIResponse_getLectureScheduleRoot>(
          url,
          { condition: { semester: 0 } },
          {
            headers: ConfigService.isApiManagerUpdated
              ? this.pulsHeadersNew
              : this.pulsHeaders,
          }
        ),
    },
    pulsGetLectureScheduleAll: {
      buildRequest: (params, url) =>
        this.http.post(
          url,
          {
            condition: {
              semester: 0,
            },
          },
          {
            headers: ConfigService.isApiManagerUpdated
              ? this.pulsHeadersNew
              : this.pulsHeaders,
          }
        ),
      responseCallback: (response) =>
        this.pulsResponseCallback(response, 'pulsGetLectureScheduleAll'),
    },
    pulsGetLectureScheduleSubTree: {
      buildRequest: (params, url) =>
        this.http.post(
          url,
          { condition: { headerId: params.headerId } },
          {
            headers: ConfigService.isApiManagerUpdated
              ? this.pulsHeadersNew
              : this.pulsHeaders,
          }
        ),
    },
    pulsGetLectureScheduleCourses: {
      buildRequest: (params, url) =>
        this.http.post(
          url,
          { condition: { headerId: params.headerId } },
          {
            headers: ConfigService.isApiManagerUpdated
              ? this.pulsHeadersNew
              : this.pulsHeaders,
          }
        ),
    },
    pulsGetCourseData: {
      buildRequest: (params, url) =>
        this.http.post(
          url,
          { condition: { courseId: params.courseId } },
          {
            headers: ConfigService.isApiManagerUpdated
              ? this.pulsHeadersNew
              : this.pulsHeaders,
          }
        ),
    },
    pulsGetPersonalStudyAreas: {
      buildRequest: (params, url) =>
        this.http.post(
          url,
          {
            'user-auth': {
              username: params.session.credentials.username,
              password: params.session.credentials.password,
            },
          },
          {
            headers: ConfigService.isApiManagerUpdated
              ? this.pulsHeadersNew
              : this.pulsHeaders,
          }
        ),
      responseCallback: (response) =>
        this.pulsResponseCallback(response, 'pulsGetPersonalStudyAreas'),
    },
    pulsGetAcademicAchievements: {
      buildRequest: (params, url) =>
        this.http.post(
          url,
          {
            condition: {
              Semester: params.semester,
              MtkNr: params.mtknr,
              StgNr: params.stgnr,
            },
            'user-auth': {
              username: params.session.credentials.username,
              password: params.session.credentials.password,
            },
          },
          {
            headers: ConfigService.isApiManagerUpdated
              ? this.pulsHeadersNew
              : this.pulsHeaders,
          }
        ),
    },
    pulsGetStudentCourses: {
      buildRequest: (params, url) =>
        this.http.post(
          url,
          {
            condition: {
              semester: 0,
              allLectures: 0,
            },
            // TODO: refactor this someday so credentials are not used
            'user-auth': {
              username: params.session.credentials.username,
              password: params.session.credentials.password,
            },
          },
          {
            headers: ConfigService.isApiManagerUpdated
              ? this.pulsHeadersNew
              : this.pulsHeaders,
          }
        ),
    },
  };

  // logger: Logger;

  constructor(
    private http: HttpClient,
    private alertService: AlertService,
    private connectionService: ConnectionService,
    private cache: CacheService // private loggingService: LoggingService
  ) {
    // this.logger = this.loggingService.getLogger('[/webservice-wrapper]');
  }

  pulsResponseCallback(response, wsName) {
    const stringResponse = JSON.stringify(response);
    if (stringResponse && stringResponse.length > 30000) {
      // this.logger.debug(
      //   'pulsResponseCallback',
      //   `calling '${wsName}': `,
      //   stringResponse.substring(0, 30000)
      // );
    } else {
      // this.logger.debug(
      //   'pulsResponseCallback',
      //   `calling '${wsName}': `,
      //   response
      // );
    }

    // PULS simply responds with "no user rights" if credentials are incorrect
    if (response && response.message && response.message === 'no user rights') {
      this.alertService.showAlert({
        headerI18nKey: 'alert.title.error',
        messageI18nKey: 'alert.token_valid_credentials_invalid',
      });
    }
    return response;
  }

  /**
   * returns a webservice definition and sets default values for a webservice
   * definitions attributes that are undefined. If the webservice is not known,
   * an error will the thrown.
   *
   * @param name {string} Name of the webservice to be returned
   */
  private getDefinition(name: string) {
    if (!this.webservices[name]) {
      // this.logger.error('getDefinition', `no webservice named ${name} defined`);
    }
    const ws = this.webservices[name];
    for (const k in this.defaults) {
      if (!ws[k]) {
        ws[k] = this.defaults[k];
      }
    }
    return ws;
  }

  /**
   * executes the specified call
   *
   * @param webserviceName {string} The name of the service to be called
   * @param params {any} Additional params that will be given to the call building function
   * @param cachingOptions {ICachingOptions} Optional parameters for caching
   */
  public call(
    webserviceName: string,
    params = {},
    cachingOptions: ICachingOptions = {}
  ) {
    // first prepare the webservice definition by adding default values if possible
    const ws = this.getDefinition(webserviceName);

    if (!ConfigService.config.webservices.endpoint[webserviceName]) {
      // this.logger.error('call', `no endpoint defined for '${webserviceName}'`);
    }

    if (!ConfigService.config.webservices.endpoint[webserviceName].url) {
      // this.logger.error(
      //   'call',
      //   `no url defined for endpoint '${webserviceName}'`
      // );
    }

    // shortcut for less repetition
    const endpoint = ConfigService.config.webservices.endpoint[webserviceName];

    // create the request by calling the defined buildRequest function
    const request = ws.buildRequest(params, endpoint.url);

    // now create a wrapping Observable around the request and attach the defined
    // callbacks to it
    const wrapperObservable = new Observable((observer) => {
      request.subscribe(
        (response) => {
          observer.next(
            ws.responseCallback(
              response,
              webserviceName,
              ConfigService.isApiManagerUpdated
            )
          );
          observer.complete();
        },
        (error) => {
          observer.error(
            ws.errorCallback(
              error,
              webserviceName,
              ConfigService.isApiManagerUpdated
            )
          );
        }
      );
    });

    if (
      endpoint.cachingEnabled === false ||
      cachingOptions.dontCache === true
    ) {
      // if caching is not desired for this endpoint we just return the observable itself
      // this.logger.debug(
      //   'call',
      //   `returning '${webserviceName}' without caching`
      // );
      return wrapperObservable;
    }

    // at this point caching seems to be desired

    /* key:
     *   1. key as defined in cachingOptions
     *   2. key = name of the webservice plus base64 encoding of the used parameters
     */
    const cacheItemKey =
      cachingOptions.key ||
      webserviceName +
        (isEmptyObject(params) ? '' : ':' + btoa(JSON.stringify(params)));

    /* groupKey:
     *   1. key as defined in cachingOptions
     *   2. key specified in endpoint config
     *   3. key = name of the webservice plus "Group", e.g. 'library' -> 'libraryGroup'
     */
    const cacheGroupKey =
      cachingOptions.groupKey ||
      ConfigService.config.webservices.endpoint[webserviceName].cacheGroupKey ||
      webserviceName + ConfigService.config.webservices.cacheGroupKeySuffix;

    /* ttl:
     *   1: ttl in cachingOptions
     *   2: ttl in config or default ttl
     *   3: no explicit ttl, which will use the default ttl set in app.component
     */
    const cacheTTL =
      cachingOptions.ttl ||
      ConfigService.config.webservices.endpoint[webserviceName].cachingTTL ||
      undefined;

    // this.logger.debug(
    //   'call',
    //   `returning '${webserviceName}' with caching, options: ${JSON.stringify(
    //     cachingOptions
    //   )}`
    // );

    if (this.connectionService.checkOnline()) {
      return from(
        Promise.all([
          cachingOptions.forceRefreshGroup
            ? this.cache.clearGroup(cacheGroupKey)
            : Promise.resolve(),
          cachingOptions.forceRefresh
            ? this.cache.removeItem(cacheItemKey)
            : Promise.resolve(),
        ])
      ).pipe(
        switchMap(() =>
          this.cache.loadFromObservable(
            cacheItemKey,
            wrapperObservable,
            cacheGroupKey,
            cacheTTL
          )
        )
      );
    } else {
      return from(
        Promise.all([
          cachingOptions.forceRefreshGroup
            ? null
            : // this.logger.debug(
              //     'call',
              //     'not clearing cache, since there is no internet connection!'
              //   )
              Promise.resolve(),
          cachingOptions.forceRefresh
            ? null
            : // this.logger.debug(
              //     'call',
              //     'not clearing cache, since there is no internet connection!'
              //   )
              Promise.resolve(),
        ])
      ).pipe(
        switchMap(() =>
          this.cache.loadFromObservable(
            cacheItemKey,
            wrapperObservable,
            cacheGroupKey,
            cacheTTL
          )
        )
      );
    }
  }
}
