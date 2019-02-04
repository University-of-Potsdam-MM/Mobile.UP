import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {ConfigProvider} from "../config/config";

export interface IErrorLogging {
  message?:string;
  url?:string;
  line?:number;
  column?:number;
  uuid?:string,
  jsonObject?:any;
}

/**
 * @name ErrorLoggingProvider
 * @description Can be used to log errors in errorAPI
 */
@Injectable()
export class ErrorLoggingProvider {

  constructor(public http: HttpClient) {}

  /**
   * @name logError
   * @description logs errors by sending them to the logging API
   * @param {IErrorLogging} errorObject
   */
  logError(errorObject:IErrorLogging){
    let headers:HttpHeaders = new HttpHeaders()
      .set("Authorization", `Bearer ${ConfigProvider.config.webservices.apiToken}`);

    console.log(`[ErrorLoggingProvider]: Logging error`);
    console.log(errorObject);
    this.http.post(
      ConfigProvider.config.webservices.endpoint.logging,
      errorObject,
      {headers: headers}
    ).subscribe(
      response => {
        console.log(`[ErrorLoggingProvider]: Logged error: ${JSON.stringify(response)}`)
      },
      error => {
        console.log(`[ErrorLoggingProvider]: Could not log error, because of yet another error: ${error}`)
      }
    )
  }
}
