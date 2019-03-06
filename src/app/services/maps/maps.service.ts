import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { ConfigService } from '../config/config.service';

@Injectable({
  providedIn: 'root'
})
export class MapsService {

  constructor(private http: HttpClient) { }

  /**
   * @name getMapData
   * @description returns map data from endpoint in regular intervals
   */
  getMapData() {
    const config = ConfigService.config;
    const headers = new HttpHeaders()
      .set('Authorization', config.webservices.apiToken);

    return this.http.get(
      config.webservices.endpoint.maps,
      { headers: headers }
    );
  }
}
