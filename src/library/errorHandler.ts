import {ErrorHandler, Injectable} from "@angular/core";
import {AlertController} from "ionic-angular";
import {AlertProvider, IErrorLogging} from "../providers/alert/alert";
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {ConfigProvider} from "../providers/config/config";

export interface IErrorObject {
  message?:string;
  type
  httpStatus?:number;
}

@Injectable()
export class MobileUPErrorHandler implements ErrorHandler {
  constructor(private alertProvider: AlertProvider,
              private http:HttpClient){}



  handleError(error:IErrorObject) {
    let errorDescription:IErrorObject;

    if(error.httpStatus){
      errorDescription.
    }

    console.log(`[MobileUPErrorHandler]: Uncaught error!\n${JSON.stringify(error)}`);

    this.alertProvider.showAlert(errorDescription);

  }
}
