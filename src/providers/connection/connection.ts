import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network';
import { Observable } from 'rxjs/Observable';
import { Platform } from 'ionic-angular';
import {ReplaySubject} from "rxjs";

/**
 * ConnectionProvider
 *
 * used to check whether a connection to the internet exists before making a
 * http call
 */
@Injectable()
export class ConnectionProvider {

  constructor(private network: Network, private platform: Platform) {}

  /**
   * checkOnline
   *
   * checks whether the device is connected to the internet. Returns Observable
   * containing either true or false, corresponding to whether an internet
   * connection is available or not
   *
   * @return Observable<boolean>
   */
  public checkOnlineAsPromise():Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      if (this.platform.is("cordova")) {
        switch(this.network.type) {
          case "unknown": {
            // there obviously is 'some' network, so I guess it's okay
            resolve(true);
            break;
          };
          case "none": {
            // there is no network
            resolve(false);
            break;
          };
          default: {
            // there is some defined type of network
            resolve(true);
            break;
          }
        }
      } else { resolve(true); }
    });
  }

  /**
   * checkOnline
   *
   * checks whether the device is connected to the internet. Returns Observable
   * containing either true or false, corresponding to whether an internet
   * connection is available or not
   *
   * @return Observable<boolean>
   */
  public checkOnline():Observable<boolean> {
    return Observable.create(observer => {
      if (this.platform.is("cordova")) {
        switch(this.network.type) {
          case "unknown": {
            // there obviously is 'some' network, so I guess it's okay
            observer.next(true);
            break;
          };
          case "none": {
            // there is no network
            observer.next(false);
            break;
          };
          default: {
            // there is some defined type of network
            observer.next(true);
            break;
          }
        }
      } else { observer.next(true); }
    });
  }
}
