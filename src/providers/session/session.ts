import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SecureStorage, SecureStorageObject } from '@ionic-native/secure-storage/ngx';
import { Storage } from '@ionic/storage';
import { Platform } from 'ionic-angular';
import { utils } from '../../library/util';

@Injectable()
export class SessionProvider {

  constructor(public http: HttpClient, private secureStorage: SecureStorage, private storage: Storage, private platform: Platform) {
  }

  public async getSession():Promise<any> {
    if (this.platform.is("cordova")) {
      return this.secureStorage.create("secureSession").then(async (storage:SecureStorageObject) => {
        let keys = await storage.keys();
        if (utils.isInArray(keys, "session")) {
          return await storage.get("session");
        } else {
          return await this.storage.get("session");
        }
      }, async error => {
        console.log("Error accessing secure storage: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
        console.log("Using normal storage...");
        return await this.storage.get("session");
      });
    } else {
      return await this.storage.get("session");
    }
  }

  public setSession(session) {
    if (this.platform.is("cordova")) {
      this.secureStorage.create("secureSession").then((storage:SecureStorageObject) => {
        storage.set("session", JSON.stringify(session)).then(() => console.log("session successfully set"), (error) => {
          console.log("Error setting session: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
        });
      }, error => {
        console.log("Error accessing secure storage: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
        console.log("Using normal storage...");
        this.storage.set("session", JSON.stringify(session)).then(() => {
          console.log("session successfully set");
        }, error => {
          console.log("Error setting session: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
        });
      });
    } else {
      this.storage.set("session", JSON.stringify(session)).then(() => {
        console.log("session successfully set");
      }, error => {
        console.log("Error setting session: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
      });
    }
  }

  public removeSession() {
    if (this.platform.is("cordova")) {
      this.secureStorage.create("secureSession").then(async (storage:SecureStorageObject) => {
        let keys = await storage.keys();
        if (utils.isInArray(keys, "session")) {
          storage.remove("session").then(() => console.log("session removed"), error => {
            console.log("Error removing session: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
          });
        } else {
          this.storage.remove("session").then(() => console.log("session removed"), error => {
            console.log("Error removing session: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
          });
        }
      }, error => {
        console.log("Error accessing secure storage: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
        console.log("Using normal storage...");
        this.storage.remove("session").then(() => console.log("session removed"), error => {
          console.log("Error removing session: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
        });
      });
    } else {
      this.storage.remove("session").then(() => console.log("session removed"), error => {
        console.log("Error removing session: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
      });
    }
  }

  public async getUserInfo():Promise<any> {
    if (this.platform.is("cordova")) {
      return this.secureStorage.create("secureSession").then(async (storage:SecureStorageObject) => {
        let keys = await storage.keys();
        if (utils.isInArray(keys, "session")) {
          return await storage.get("userInformation");
        } else {
          return await this.storage.get("userInformation");
        }
      }, async error => {
        console.log("Error accessing secure storage: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
        console.log("Using normal storage...");
        return await this.storage.get("userInformation");
      });
    } else {
      return await this.storage.get("userInformation");
    }
  }

  public setUserInfo(userInfo) {
    if (this.platform.is("cordova")) {
      this.secureStorage.create("secureSession").then((storage:SecureStorageObject) => {
        storage.set("userInformation", JSON.stringify(userInfo)).then(() => console.log("user info successfully set"), error => {
          console.log("Error setting user info: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
        });
      }, error => {
        console.log("Error accessing secure storage: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
        console.log("Using normal storage...");
        this.storage.set("userInformation", JSON.stringify(userInfo)).then(() => console.log("user info successfully set"), error => {
          console.log("Error setting user info: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
        });
      });
    } else {
      this.storage.set("userInformation", JSON.stringify(userInfo)).then(() => console.log("user info successfully set"), error => {
        console.log("Error setting user info: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
      });
    }
  }

  public removeUserInfo() {
    if (this.platform.is("cordova")) {
      this.secureStorage.create("secureSession").then(async (storage:SecureStorageObject) => {
        let keys = await storage.keys();
        if (utils.isInArray(keys, "session")) {
          storage.remove("userInformation").then(() => console.log("user info removed"), error => {
            console.log("Error removing user info: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
          });
        } else {
          this.storage.remove("userInformation").then(() => console.log("user info removed"), error => {
            console.log("Error removing user info: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
          });
        }
      }, error => {
        console.log("Error accessing secure storage: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
        console.log("Using normal storage...");
        this.storage.remove("userInformation").then(() => console.log("user info removed"), error => {
          console.log("Error removing user info: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
        });
      });
    } else {
      this.storage.remove("userInformation").then(() => console.log("user info removed"), error => {
        console.log("Error removing user info: " + JSON.stringify(error, Object.getOwnPropertyNames(error)));
      });
    }
  }

}