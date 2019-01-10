import { ErrorHandler, Injectable} from "@angular/core";
import { AlertProvider } from "../providers/alert/alert";
import { ErrorLoggingProvider } from "../providers/error-logging/error-logging";
import { Device } from "@ionic-native/device";
import { Platform } from "ionic-angular";
import { HttpErrorResponse } from "@angular/common/http";

@Injectable()
export class MobileUPErrorHandler implements ErrorHandler {
  constructor(private alertProvider: AlertProvider,
              private logging:ErrorLoggingProvider,
              private platform:Platform,
              private device: Device){
  }

  /**
   * @name handleError
   * @description handles uncaught errors
   * @param error
   */
  handleError(error) {

    let uuid = "none";
    if(this.platform.is("cordova")){
      uuid = this.device.uuid;
    }

    if(error instanceof HttpErrorResponse){
      console.log(`[MobileUPErrorHandler]: Uncaught HTTP error!`);

      let alertTitleI18nKey = `alert.title.httpError`;
      let messageI18nKey = `alert.httpErrorStatus.unknown`;

      if(error.status) {
        messageI18nKey = `alert.httpErrorStatus.${error.status}`
      }

      this.alertProvider.showAlert({
        alertTitleI18nKey: alertTitleI18nKey,
        messageI18nKey: messageI18nKey
      });

      this.logging.logError({
        uuid:uuid,
        url:error.url,
        message:`HttpError ${error.status} occured`
      })
    } else {
      console.log(`[MobileUPErrorHandler]: Uncaught error!`);

      this.alertProvider.showAlert({
        alertTitleI18nKey:"alert.title.unexpectedError",
        messageI18nKey:"alert.unknown_error"
      });

      let caller_line = error.stack.split("\n")[1];
      let index = caller_line.indexOf("at ");
      let cleanedURL = caller_line.slice(index+2, caller_line.length);

      this.logging.logError({
        uuid: uuid,
        message: `Unexpected error: ${error.message? error.message : "no message provided"}`,
        url: cleanedURL
      })
    }

  }
}
