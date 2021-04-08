import { Injectable } from '@angular/core';
import { Storage } from '@capacitor/storage';

@Injectable({
  providedIn: 'root',
})
export class UserSessionService {
  constructor() {}

  async getSession(): Promise<any> {
    const sessionObj = await Storage.get({ key: 'session' });
    const session = JSON.parse(sessionObj.value);
    return session;
  }

  setSession(session): Promise<any> {
    return Storage.set({ key: 'session', value: JSON.stringify(session) });
  }

  removeSession(): Promise<any> {
    return Storage.remove({ key: 'session' });
  }
}
