import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { NavController } from '@ionic/angular';
import { UserSessionService } from '../user-session/user-session.service';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationGuardService implements CanActivate {
  constructor(
    private sessionProvider: UserSessionService,
    private navCtrl: NavController
  ) {}

  async canActivate(): Promise<boolean> {
    // Check weather the route can be activated;
    const session = await this.sessionProvider.getSession();

    if (session) {
      return true;
    } else {
      this.navCtrl.navigateForward('/login');
      return false;
    }
  }
}
