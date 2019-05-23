import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { ConfigService } from '../config/config.service';
import {WebserviceWrapperService} from '../webservice-wrapper/webservice-wrapper.service';

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

  constructor(private ws: WebserviceWrapperService) { }

  /**
   * @name logError
   * @description logs errors by sending them to the logging API
   * @param {IErrorLogging} errorObject
   */
  logError(errorObject: IErrorLogging) {
    console.log(`[ErrorService]: Logging error`);
    console.log(errorObject);
    this.ws.call('logging', errorObject).subscribe(response => {
        console.log(`[ErrorService]: Logged error: ${JSON.stringify(response)}`);
      },
      error => {
        console.log(`[ErrorService]: Could not log error, because of yet another error: ${error}`);
      });
  }
}
