import {ErrorHandler, Injectable} from "@angular/core";
import {AlertController} from "ionic-angular";

export interface IErrorObject {
  message?:string;
  httpStatus?:number;
}

@Injectable()
export class MobileUPErrorHandler implements ErrorHandler {
  constructor(private alertCtrl: AlertController){

  }

  handleError(error:IErrorObject) {
    console.log("[MobileUPErrorHandler]: Uncaught error!");
    console.log(error);
    let alert = this.alertCtrl.create({
      message: error.message
    })

    alert.present()
  }
}
