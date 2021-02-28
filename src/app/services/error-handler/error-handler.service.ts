import { Injectable } from "@angular/core";
import { WebserviceWrapperService } from "../webservice-wrapper/webservice-wrapper.service";
import { Logger, LoggingService } from "ionic-logging-service";

export interface IErrorLogging {
  message?: string;
  url?: string;
  line?: number;
  column?: number;
  uuid?: string;
  jsonObject?: any;
}

@Injectable({
  providedIn: "root",
})
export class ErrorHandlerService {
  logger: Logger;

  constructor(
    private ws: WebserviceWrapperService,
    private loggingService: LoggingService
  ) {
    this.logger = this.loggingService.getLogger("[/error-handler]");
  }

  /**
   * @name logError
   * @description logs errors by sending them to the logging API
   * @param {IErrorLogging} errorObject
   */
  logError(errorObject: IErrorLogging) {
    this.logger.error("logError", errorObject);
    this.ws.call("logging", errorObject).subscribe(
      (response) => {
        this.logger.debug("logError", "logged error", response);
      },
      (error) => {
        this.logger.error(
          "logError",
          "could not log error, because of yet another error",
          error
        );
      }
    );
  }
}
