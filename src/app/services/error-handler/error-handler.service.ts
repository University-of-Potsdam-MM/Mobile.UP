import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { ConfigService } from '../config/config.service';

export interface IErrorLogging {
  message?: string;
  url?: string;
  line?: number;
  column?: number;
  uuid?: string;
  jsonObject?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor(private http: HttpClient) { }

  /**
   * @name logError
   * @description logs errors by sending them to the logging API
   * @param {IErrorLogging} errorObject
   */
  logError(errorObject: IErrorLogging) {
    const config = ConfigService.config;
    const headers: HttpHeaders = new HttpHeaders()
      .set('Authorization', config.webservices.apiToken);

    console.log(`[ErrorService]: Logging error`);
    console.log(errorObject);
    this.http.post(
      config.webservices.endpoint.logging.url,
      errorObject,
      {headers: headers}
    ).subscribe(response => {
        console.log(`[ErrorService]: Logged error: ${JSON.stringify(response)}`);
      },
      error => {
        console.log(`[ErrorService]: Could not log error, because of yet another error: ${error}`);
      });
  }
}
