import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { ConfigService } from '../config/config.service';
import { CacheService } from 'ionic-cache';

@Injectable({
  providedIn: 'root'
})
export class MapsService {

  constructor(
    private http: HttpClient,
    private cache: CacheService
    ) { }

  /**
   * @name getMapData
   * @description returns map data from endpoint in regular intervals
   */
  getMapData() {
    const config = ConfigService.config;
    const headers = new HttpHeaders()
      .set('Authorization', config.webservices.apiToken);

    const request = this.http.get(config.webservices.endpoint.maps, { headers: headers });

    return this.cache.loadFromObservable('getMapData', request);
  }
}
