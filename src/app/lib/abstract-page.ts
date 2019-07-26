import { ISession } from '../services/login-provider/interfaces';
import { ConnectionService } from '../services/connection/connection.service';
import { UserSessionService } from '../services/user-session/user-session.service';
import { Injector, Type } from '@angular/core';
import { StaticInjectorService } from './static-injector';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuController, NavController } from '@ionic/angular';
import {IConfig, IModule} from './interfaces';
import { ConfigService } from '../services/config/config.service';
import { Logger, LoggingService } from 'ionic-logging-service';
import {WebIntentService} from '../services/web-intent/web-intent.service';
import {Observable} from 'rxjs';
import {utils} from './util';
import isEmptyObject = utils.isEmptyObject;

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
export abstract class AbstractPage  {

    logger: Logger;
    session: ISession;

    pageReady: Promise<void>;
    pageReadyResolve: () => void;
    pageReadyReject: (error) => void;

    protected sessionProvider: UserSessionService;
    protected connection: ConnectionService;
    protected activatedRoute: ActivatedRoute;
    protected menu: MenuController;
    protected navCtrl: NavController;
    protected config: IConfig;
    protected loggingService: LoggingService;
    protected router: Router;
    protected webIntent: WebIntentService;

    protected constructor(
        pageOptions?: IPageOptions
    ) {

      const injector: Injector = StaticInjectorService.getInjector();

      this.loggingService = injector.get<LoggingService>(LoggingService as Type<LoggingService>);
      this.router = injector.get<Router>(Router as Type<Router>);
      this.connection = injector.get<ConnectionService>(ConnectionService as Type<ConnectionService>);
      this.sessionProvider = injector.get<UserSessionService>(UserSessionService as Type<UserSessionService>);
      this.activatedRoute = injector.get<ActivatedRoute>(ActivatedRoute as Type<ActivatedRoute>);
      this.menu = injector.get<MenuController>(MenuController as Type<MenuController>);
      this.navCtrl = injector.get<NavController>(NavController as Type<NavController>);
      this.webIntent = injector.get<WebIntentService>(WebIntentService as Type<WebIntentService>);

      this.logger = this.loggingService.getLogger('[' + this.router.url + ']');

      this.config = ConfigService.config;

      if (pageOptions) { this.processOptions(pageOptions); }

      // Assign pageReady promises. Those should be called from a page
      // implementing this one
      this.pageReady = new Promise(
        (resolve, reject) => {
          this.pageReadyResolve = () => {
            this.logger.info('page is now ready');
            resolve();
          };
          this.pageReadyReject = (error) => {
            this.logger.error(`page is not ready: ${error}`);
            reject();
          };
        }
      );

      // Forwarding queryParams to the pre-existing handleQueryParams function.
      // The existing one doesn't do anything, though
      this.activatedRoute.queryParams.subscribe(
        params => {
          const parsedParams = {};
          for (const k in params) {
            parsedParams[k] = JSON.parse(params[k]);
          }
          if (!isEmptyObject(parsedParams)) {
            this.setMenuStatus(parsedParams['menu']);
            this.pageReady.then(
              () => this.handleQueryParams(parsedParams)
            );
          }
        }
      );
    }

    /**
     * process the given pageOptions and execute desired functions
     * @param pageOptions
     */
    private processOptions(pageOptions: IPageOptions) {
      if (pageOptions.requireSession) { this.requireSession(false); }
      if (pageOptions.requireNetwork) { this.requireNetwork(true); }
      if (pageOptions.optionalSession) { this.requireSession(true); }
      if (pageOptions.optionalNetwork) { this.requireNetwork(false); }
    }

    /**
     * enables or disables the pages menu section
     * @param shouldEnable
     */
    private setMenuStatus(shouldEnable: boolean = true) {
      this.menu.enable(shouldEnable);
    }

    /**
     * handles the queryParams for a page. Should be overwritten.
     * @param params {any} the params that should be handled
     */
    handleQueryParams(params: any) {
      this.logger.info(`Did not handle queryParams: '${JSON.stringify(params)}'`);
    }

    /**
     * opens a page by using it's module
     * @description opens selected page by pushing it on the stack
     * @param module {IModule} module to be used
     * @param params {any} params {any} params that should by passed on
     */
    openModule(module: IModule, params: any = {}) {
      if (module.url) {
        this.webIntent.handleWebIntentForModule(module.componentName);
      } else {
        this.navCtrl.navigateForward(
          '/' + module.componentName,
          {state: params}
        );
      }
    }

    /**
     * opens a page by name
     * @param moduleName {string} name of the module
     * @param params {any} params that should by passed on
     */
    openModuleByName(moduleName: string, params: any = {}) {
      const module = this.config.modules[moduleName];
      if (module) {
        this.openModule(module, params);
      } else {
        this.logger.error(`Cannot open unknown module '${moduleName}'`);
      }
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
        if (!this.session && !optional) { this.navCtrl.navigateForward('/login'); }
    }
}
