import { Injectable } from '@angular/core';
import { Storage } from '@capacitor/storage';

@Injectable({
  providedIn: 'root',
})
export class UserSessionService {
  constructor() {}

  getSession(): Promise<any> {
    return Storage.get({ key: 'session' });
  }

  setSession(session): Promise<any> {
    return Storage.set({ key: 'session', value: session });
  }

  removeSession(): Promise<any> {
    return Storage.remove({ key: 'session' });
  }
}
