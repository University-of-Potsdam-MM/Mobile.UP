import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage";

@Injectable({
  providedIn: "root",
})
export class UserSessionService {
  constructor(private storage: Storage) {}

  getSession(): Promise<any> {
    return this.storage.get("session");
  }

  setSession(session): Promise<any> {
    return this.storage.set("session", session);
  }

  removeSession(): Promise<any> {
    return this.storage.remove("session");
  }
}
