import {HttpClient, HttpHeaders} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {IConfig} from "../../library/interfaces";
import {ConfigProvider} from "../config/config";

@Injectable()
export class WebServiceProvider {

  config:IConfig = ConfigProvider.config;

  constructor(public http: HttpClient) {
  }


  /**
   * @name getMapData
   * @description returns map data from endpoint in regular intervals
   */
  public getMapData(){
    let headers = new HttpHeaders()
      .set("Authorization", this.config.webservices.apiToken);

    return this.http.get(
      this.config.webservices.endpoint.maps,
      { headers: headers }
    )
  }
}
