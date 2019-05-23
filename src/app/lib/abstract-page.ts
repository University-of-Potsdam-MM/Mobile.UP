import { ISession } from '../services/login-provider/interfaces';
import { ConnectionService } from '../services/connection/connection.service';
import { UserSessionService } from '../services/user-session/user-session.service';
import { Injector, Type } from '@angular/core';
import { StaticInjectorService } from './static-injector';
import { ActivatedRoute } from '@angular/router';
import { MenuController, NavController } from '@ionic/angular';
import { IConfig } from './interfaces';
import { ConfigService } from '../services/config/config.service';

export interface IPageOptions {
    requireSession?: boolean;
    requireNetwork?: boolean;
    optionalSession?: boolean;
    optionalNetwork?: boolean;
}

/**
 * @name AbstractPage
 * @classdesc An abstract implementation of a Page already implementing basic
 * features most Pages might use. To fire those features only this classes
 * constructor must be called with the desired options.
 *
 * https://robferguson.org/blog/2018/09/28/ionic-3-component-inheritance/
 */
export abstract class AbstractPage  {

    session: ISession;
    protected sessionProvider: UserSessionService;
    protected connection: ConnectionService;
    protected activatedRoute: ActivatedRoute;
    protected menu: MenuController;
    protected navCtrl: NavController;
    protected config: IConfig;

    protected constructor(
        pageOptions?: IPageOptions
    ) {
        const injector: Injector = StaticInjectorService.getInjector();
        this.connection = injector.get<ConnectionService>(ConnectionService as Type<ConnectionService>);
        this.sessionProvider = injector.get<UserSessionService>(UserSessionService as Type<UserSessionService>);
        this.activatedRoute = injector.get<ActivatedRoute>(ActivatedRoute as Type<ActivatedRoute>);
        this.menu = injector.get<MenuController>(MenuController as Type<MenuController>);
        this.navCtrl = injector.get<NavController>(NavController as Type<NavController>);
        this.config = ConfigService.config;

        if (pageOptions) { this.processOptions(pageOptions); }
        this.setMenuStatus();
    }

    private processOptions(pageOptions: IPageOptions) {
        if (pageOptions.requireSession) { this.requireSession(false); }
        if (pageOptions.requireNetwork) { this.requireNetwork(false); }
        if (pageOptions.optionalSession) { this.requireSession(true); }
        if (pageOptions.optionalNetwork) { this.requireNetwork(true); }
    }

    private setMenuStatus() {
        // if url parameter = .../pagename?menu=false  then hide the menu
        this.activatedRoute.queryParams.subscribe(urlParams => {
            if (urlParams && (urlParams.menu === 'false')) {
                this.menu.enable(false);
            } else { this.menu.enable(true); }
        }, error => {
            console.log(error);
            this.menu.enable(true);
        });
    }

    /**
     * @name requireNetwork
     * @desc tests for network connection and sends the user back to the HomePage
     * if there is none;
     */
    requireNetwork(optional?) {
        console.log('[AbstractPage]: Network required.');
        // I think we have to re-evalue this; how do we handle cached content?
        this.connection.checkOnline(true, optional);
    }

    /**
     * @name requireSession
     * @desc tests for existing session and sends user to LoginPage in case none is found
     */
    async requireSession(optional?) {
        console.log('[AbstractPage]: Requires session');

        this.session = await this.sessionProvider.getSession();
        if (!this.session && !optional) { this.navCtrl.navigateForward('/login'); }
    }
}
