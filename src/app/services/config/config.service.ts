import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { IConfig, EmergencyCall } from "src/app/lib/interfaces";
import { Logger, LoggingService } from "ionic-logging-service";

@Injectable({
  providedIn: "root",
})
export class ConfigService {
  static config: IConfig;
  static emergency: EmergencyCall[];
  logger: Logger;
  static isApiManagerUpdated: boolean;

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) {
    this.logger = this.loggingService.getLogger("[/config-service]");
  }

  /**
   * loads config file.
   * https://blogs.msdn.microsoft.com/premier_developer/2018/03/01/angular-how-to-editable-config-files/
   *
   */
  load(uri: string) {
    return new Promise<void>((resolve, reject) => {
      this.http
        .get(uri)
        .toPromise()
        .then((response: IConfig) => {
          ConfigService.config = response;
          resolve();
        })
        .catch((response: any) => {
          reject(`Could not load file '${uri}'`);
          this.logger.error("load", response);
        });
    });
  }

  loadEmergency(uri: string) {
    return new Promise<void>((resolve, reject) => {
      this.http
        .get(uri)
        .toPromise()
        .then((response: EmergencyCall[]) => {
          ConfigService.emergency = response;
          resolve();
        })
        .catch((response: any) => {
          reject(`Could not load file '${uri}'`);
          this.logger.error("loadEmergency", response);
        });
    });
  }

  loadApiManagerStatus() {
    return new Promise<void>((resolve) => {
      this.http
        .get("https://apiup.uni-potsdam.de/endpoints/services/Version", {
          responseType: "text",
        })
        .subscribe(
          (apiManagerVersion) => {
            if (apiManagerVersion.includes("WSO2 API Manager-2.1.0")) {
              ConfigService.isApiManagerUpdated = false;
              this.logger.debug("API Manager is not updated yet.");
              resolve();
            } else {
              ConfigService.isApiManagerUpdated = true;
              this.logger.debug("API Manager is updated.");
              resolve();
            }
          },
          (error) => {
            this.logger.error("loadApiManagerStatus", error);
            ConfigService.isApiManagerUpdated = false;
            this.logger.debug(
              "API Manager status could not be loaded // is not updated yet."
            );
            resolve();
          }
        );
    });
  }
}
