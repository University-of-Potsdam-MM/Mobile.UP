import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class UserSessionService {
  constructor() {}

  async getSession(): Promise<any> {
    const sessionObj = await Preferences.get({ key: 'session' });
    const session = JSON.parse(sessionObj.value);
    return session;
  }

  setSession(session): Promise<any> {
    return Preferences.set({ key: 'session', value: JSON.stringify(session) });
  }

  removeSession(): Promise<any> {
    return Preferences.remove({ key: 'session' });
  }
}
