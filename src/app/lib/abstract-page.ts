import { ISession } from '../services/login-service/interfaces';
import { ConnectionService } from '../services/connection/connection.service';
import { UserSessionService } from '../services/user-session/user-session.service';
import { Injector, Type } from '@angular/core';
import { StaticInjectorService } from './static-injector';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuController, NavController, Platform } from '@ionic/angular';
import { Logger, LoggingService } from 'ionic-logging-service';
import { WebIntentService } from '../services/web-intent/web-intent.service';
import { isEmptyObject } from './util';

export interface IPageOptions {
  requireSession?: boolean;
  // if the page doesn't work without network at all
  // f.e. library search
  requireNetwork?: boolean;
  optionalSession?: boolean;
  // if the page could work with cached content
  // make sure you show an hint if there is no cached content available
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
export abstract class AbstractPage {
  logger: Logger;
  session: ISession;

  pageReady: Promise<void>;
  pageReadyResolve: () => void;
  pageReadyReject: (error) => void;

  public platform: Platform;
  protected sessionProvider: UserSessionService;
  protected connection: ConnectionService;
  protected activatedRoute: ActivatedRoute;
  protected menu: MenuController;
  protected navCtrl: NavController;
  protected loggingService: LoggingService;
  protected router: Router;
  protected webIntent: WebIntentService;

  protected constructor(pageOptions?: IPageOptions) {
    const injector: Injector = StaticInjectorService.getInjector();

    this.loggingService = injector.get<LoggingService>(
      LoggingService as Type<LoggingService>
    );
    this.router = injector.get<Router>(Router as Type<Router>);
    this.connection = injector.get<ConnectionService>(
      ConnectionService as Type<ConnectionService>
    );
    this.sessionProvider = injector.get<UserSessionService>(
      UserSessionService as Type<UserSessionService>
    );
    this.activatedRoute = injector.get<ActivatedRoute>(
      ActivatedRoute as Type<ActivatedRoute>
    );
    this.menu = injector.get<MenuController>(
      MenuController as Type<MenuController>
    );
    this.navCtrl = injector.get<NavController>(
      NavController as Type<NavController>
    );
    this.webIntent = injector.get<WebIntentService>(
      WebIntentService as Type<WebIntentService>
    );
    this.platform = injector.get<Platform>(Platform as Type<Platform>);

    this.logger = this.loggingService.getLogger('[' + this.router.url + ']');

    if (pageOptions) {
      this.processOptions(pageOptions);
    }

    // Assign pageReady promises. Those should be called from a page
    // implementing this one
    this.pageReady = new Promise((resolve, reject) => {
      this.pageReadyResolve = () => {
        this.logger.info('page is now ready');
        resolve();
      };
      this.pageReadyReject = (error) => {
        this.logger.error(`page is not ready: ${error}`);
        reject();
      };
    });

    // Forwarding queryParams to the pre-existing handleQueryParams function.
    // The existing one doesn't do anything, though
    this.activatedRoute.queryParams.subscribe((params) => {
      const parsedParams: any = {};
      // eslint-disable-next-line guard-for-in
      for (const k in params) {
        parsedParams[k] = JSON.parse(params[k]);
      }
      if (!isEmptyObject(parsedParams)) {
        this.setMenuStatus(parsedParams.menu);
        this.pageReady.then(() => this.handleQueryParams(parsedParams));
      }
    });
  }

  /**
   * handles the queryParams for a page. Should be overwritten.
   *
   * @param params {any} the params that should be handled
   */
  handleQueryParams(params: any) {
    this.logger.info(`Did not handle queryParams: '${JSON.stringify(params)}'`);
  }

  /**
   * @name requireNetwork
   * @desc tests for network connection and sends the user back to the HomePage
   * if there is none;
   */
  requireNetwork(necessary?) {
    this.logger.debug('requireNetwork');
    this.connection.checkOnline(true, necessary);
  }

  /**
   * @name requireSession
   * @desc tests for existing session and sends user to LoginPage in case none is found
   */
  async requireSession(optional?) {
    this.logger.debug('requireSession');

    this.session = await this.sessionProvider.getSession();
    if (!this.session && !optional) {
      this.navCtrl.navigateRoot('/home').then(() => {
        this.navCtrl.navigateForward('/login');
      });
    }
  }

  /**
   * process the given pageOptions and execute desired functions
   *
   * @param pageOptions
   */
  private processOptions(pageOptions: IPageOptions) {
    if (pageOptions.requireSession) {
      this.requireSession(false);
    }
    if (pageOptions.requireNetwork) {
      this.requireNetwork(true);
    }
    if (pageOptions.optionalSession) {
      this.requireSession(true);
    }
    if (pageOptions.optionalNetwork) {
      this.requireNetwork(false);
    }
  }

  /**
   * enables or disables the pages menu section
   *
   * @param shouldEnable
   */
  private setMenuStatus(shouldEnable = true) {
    this.menu.enable(shouldEnable);
  }
}
