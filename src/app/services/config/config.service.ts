import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IConfig, EmergencyCall } from 'src/app/lib/interfaces';
import { Logger, LoggingService } from 'ionic-logging-service';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  static config: IConfig;
  static emergency: EmergencyCall[];
  logger: Logger;
  static isApiManagerUpdated: boolean;

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private loggingService: LoggingService
    ) {
      this.logger = this.loggingService.getLogger('[/config-service]');
    }

  /**
   * loads config file.
   * https://blogs.msdn.microsoft.com/premier_developer/2018/03/01/angular-how-to-editable-config-files/
   *
   */
  load(uri: string) {
    return new Promise<void>((resolve, reject) => {
      this.http.get(uri).toPromise().then(
        (response: IConfig) => {
          ConfigService.config = response;
          resolve();
        }
      ).catch(
        (response: any) => {
          reject(`Could not load file '${uri}'`);
          this.logger.error('load', response);
        });
    });
  }

  loadEmergency(uri: string) {
    return new Promise<void>((resolve, reject) => {
      this.http.get(uri).toPromise().then(
        (response: EmergencyCall[]) => {
          ConfigService.emergency = response;
          resolve();
        }
      ).catch(
        (response: any) => {
          reject(`Could not load file '${uri}'`);
          this.logger.error('loadEmergency', response);
        });
    });
  }

  loadApiManagerStatus() {
    return new Promise<void>((resolve, reject) => {
      this.storage.get("isApiManagerUpdated").then(response => {
        //ConfigService.isApiManagerUpdated = response ? true : false;
        ConfigService.isApiManagerUpdated = true;
        resolve();
      }).catch(error => {
        reject("Could not load api manager status");
        this.logger.error("loadApiManagerStatus", error);
      })
    });
  }
}
