import {ErrorHandler, Injectable} from "@angular/core";
import {
  AlertProvider,
  EAlertType,
  EErrorType,
  IAlertOptions
} from "../providers/alert/alert";
import {
  ErrorLoggingProvider,
  IErrorLogging
} from "../providers/error-logging/error-logging";
import {Device} from "@ionic-native/device";
import {Platform} from "ionic-angular";
import {HttpErrorResponse} from "@angular/common/http";

export interface IErrorObject {
  stack;
  message?:string;
  type;
  status?:number;
}

@Injectable()
export class MobileUPErrorHandler implements ErrorHandler {
  constructor(private alertProvider: AlertProvider,
              private logging:ErrorLoggingProvider,
              private platform:Platform,
              private device: Device){
  }

  logError(error){

    let uuid = "none";
    if(this.platform.is("cordova")){
      uuid = this.device.uuid;
    }
    // this.logging.logError({
    //   url:"some_url",
    //   column: 0,
    //   line: 0,
    //   message: error.message,
    //   jsonObject: error,
    //   uuid: uuid
    // });
  }

  /**
   * @name handleError
   * @description handles uncaught errors
   * @param error
   */
  handleError(error:IErrorObject) {

    if(error instanceof HttpErrorResponse){
      console.log(`[MobileUPErrorHandler]: Uncaught HTTP error!`);
      console.log(error);


      let alertTitleI18nKey = `alert.title.error`;
      let messageI18nKey = `alert.httpErrorStatus.unknown`;

      if(error.status) {
        messageI18nKey = `alert.httpErrorStatus.${error.status}`
      }

      this.alertProvider.showAlert({
        alertTitleI18nKey: alertTitleI18nKey,
        messageI18nKey: messageI18nKey
      })
    }

    this.logError(error);
  }
}
