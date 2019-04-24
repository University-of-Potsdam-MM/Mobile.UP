import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {IConfig} from './lib/interfaces';
import {ConfigService} from './services/config/config.service';
import {UserSessionService} from './services/user-session/user-session.service';
import {Observable} from 'rxjs';
import {CacheService} from 'ionic-cache';

export interface IWebservice {
  buildCall: (...args: any[]) => Observable<any>;
  processResponse?: (response: any) => any;
  processError?: (error: any) => any;
}

@Injectable({
  providedIn: 'root'
})
export class WebserviceWrapperService {

  private config: IConfig = ConfigService.config;

  private apiTokenHeader = {Authorization: this.config.webservices.apiToken};

  private defaults = {
    processResponse: (response: any) => {
      return response;
    },
    processError: (error, wsName) => {
      console.log(`[Webservice]: Error when calling ${wsName}: ${error}`);
      return [];
    }
  };

  private webservices: {[wsName: string]: IWebservice} = {
    maps: {
      buildCall: () => {
        return this.http.get(
          this.config.webservices.endpoint.maps,
          {headers: this.apiTokenHeader}
        );
      }
    },
    mensa: {
      buildCall: (location: string) => {
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
      buildCall: (query: string) => {
        return this.http.get(
          this.config.webservices.endpoint.personSearch + query,
          {
            headers: this.apiTokenHeader
          }
        );
      }
    },
    roomsFree: {
      buildCall: (params) => {
        return this.http.get(
          this.config.webservices.endpoint.roomsSearch,
          {
            headers: this.apiTokenHeader,
            params: this.createRoomParams(params.timeSlot, params.location)
          }
        );
      }
    },
    roomsBooked: {
      buildCall: (params) => {
        return this.http.get(
          this.config.webservices.endpoint.roomplanSearch,
          {
            headers: this.apiTokenHeader,
            params: this.createRoomParams(params.timeSlot, params.location)
          }
        );
      }
    }
  };

  constructor(private http: HttpClient,
              private cache: CacheService,
              private session: UserSessionService) {  }

  /**
   *
   * @param timeSlot
   * @param location
   */
  private createRoomParams(timeSlot: {start: number, end: number}, location) {
    const start = new Date();
    const end = new Date();
    start.setHours(timeSlot.start);
    end.setHours(timeSlot.end);
    return {
      format: 'json',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      campus: location
    };
  }

  /**
   *
   * @param name
   */
  private prepareWebserviceDefinition(name: string) {
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

    const ws = this.prepareWebserviceDefinition(webserviceName);

    const observable = new Observable(
      observer => {
        ws.buildCall(params).subscribe(
          response => {
            observer.next(ws.processResponse(response));
            observer.complete();
          },
          error => {
            observer.error(ws.processError(error));
          }
        );
      }
    );

    if (cache) {
      return this.cache.loadFromObservable(
        webserviceName + ':' + btoa(JSON.stringify(params)),
        observable
      );
    }

    return observable;
  }
}
