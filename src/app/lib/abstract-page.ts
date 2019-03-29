import { ISession } from '../services/login-provider/interfaces';
import { ReplaySubject } from 'rxjs';
import { ConnectionService } from '../services/connection/connection.service';
import { UserSessionService } from '../services/user-session/user-session.service';
import { Injector, Type } from '@angular/core';
import { StaticInjectorService } from './static-injector';
import { ActivatedRoute } from '@angular/router';
import { MenuController } from '@ionic/angular';

export interface IPageOptions {
    requireSession?: boolean;
    requireNetwork?: boolean;
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

    protected session: ISession;
    protected sessionObservable: ReplaySubject<ISession>;
    protected connection: ConnectionService;
    protected sessionProvider: UserSessionService;
    protected activatedRoute: ActivatedRoute;
    protected menu: MenuController;
    //   protected app: App;

    protected constructor(
        pageOptions?: IPageOptions
    ) {
        const injector: Injector = StaticInjectorService.getInjector();
        this.connection = injector.get<ConnectionService>(ConnectionService as Type<ConnectionService>);
        this.sessionProvider = injector.get<UserSessionService>(UserSessionService as Type<UserSessionService>);
        this.activatedRoute = injector.get<ActivatedRoute>(ActivatedRoute as Type<ActivatedRoute>);
        this.menu = injector.get<MenuController>(MenuController as Type<MenuController>);
        // this.app = injector.get<App>(App as Type<App>);

        this.processOptions(pageOptions);
        this.setMenuStatus();
    }

    private processOptions(pageOptions: IPageOptions) {
        if (pageOptions.requireSession) { this.requireSession(); }
        if (pageOptions.requireNetwork) { this.requireNetwork(); }
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
    requireNetwork() {
        // console.log('[AbstractPage]: Requires network');

        // I think we have to re-evalue this; how do we handle cached content?
        // this.connection.checkOnline(true, true);
    }

    /**
     * @name requireSession
     * @desc tests for existing session and sends user to LoginPage in case none is found
     */
    requireSession() {
        // console.log('[AbstractPage]: Requires session');

        // TODO: not working yet. SessionProvider is setting the session too slowly.
        // so this function will always find that there is no session, even though
        // some milliseconds later there would be one.

        // this.sessionObservable = new ReplaySubject<ISession>();
        //
        // this.sessionProvider.getSession().then(
        //   (sessionObj:ISession) => {
        //     if (sessionObj) {
        //       if (typeof sessionObj !== 'object') {
        //         this.session = JSON.parse(sessionObj);
        //       } else {
        //         this.session = sessionObj;
        //       }
        //       this.sessionObservable.next(this.session);
        //     } else {
        //       this.sessionObservable.error("no session");
        //
        //       console.log("Pushing LoginPage");
        //       this.app.getActiveNavs()[0].push(LoginPage);
        //     }
        //   }
        // );
    }
}
