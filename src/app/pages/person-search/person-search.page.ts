/* eslint-disable @typescript-eslint/dot-notation */
import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { IPerson } from 'src/app/lib/interfaces';
import { UPLoginProvider } from 'src/app/services/login-service/login';
import { AbstractPage } from 'src/app/lib/abstract-page';
import { WebserviceWrapperService } from '../../services/webservice-wrapper/webservice-wrapper.service';
import { IPersonsRequestParams } from '../../services/webservice-wrapper/webservice-definition-interfaces';
import { ConfigService } from 'src/app/services/config/config.service';
import { Keyboard } from '@capacitor/keyboard';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-person-search',
  templateUrl: './person-search.page.html',
  styleUrls: ['./person-search.page.scss'],
})
export class PersonSearchPage extends AbstractPage implements OnInit {
  personsFound: IPerson[] = [];
  response_received: boolean;
  error: HttpErrorResponse;
  query = '';
  noResults = false;
  triedRefreshingSession = false;

  constructor(
    private login: UPLoginProvider,
    private ws: WebserviceWrapperService,
    public translate: TranslateService
  ) {
    super({ optionalNetwork: true, requireSession: true });
  }

  ngOnInit() {
    this.refreshToken();
  }

  // hides keyboard once the user is scrolling
  onScrollListener() {
    if (this.platform.is('ios') || this.platform.is('android')) {
      Keyboard.hide();
    }
  }

  /**
   * @name search
   * @async
   * @description checks whether a session is stored in memory. If not the user is taken to
   * the LoginPage. If yes a query is sent to the API and the results are placed
   * in this.personsFound so the view can render them
   */
  public async search() {
    // reset array so new persons are displayed
    this.personsFound = [];
    this.noResults = false;

    let sQuery;

    if (this.query) {
      sQuery = encodeURI(this.query.trim());
    }

    if (sQuery) {
      sQuery = sQuery
        .replace(/\+/g, '')
        .replace(/,/g, '')
        .replace(/\//g, '')
        .replace(/:/g, '')
        .replace(/;/g, '')
        .replace(/@/g, '')
        .replace(/=/g, '')
        .replace(/\$/g, '')
        .replace(/&/g, '');
    }

    if (sQuery && sQuery.trim() !== '' && sQuery.trim().length > 1) {
      this.response_received = false;

      // this.logger.debug('search', `searching for "${sQuery}"`);

      if (!this.session) {
        this.session = await this.sessionProvider.getSession();
      }

      this.ws
        .call('personSearch', {
          query: sQuery,
          session: this.session,
        } as IPersonsRequestParams)
        .subscribe(
          (personsList: IPerson[]) => {
            for (const person of personsList) {
              const newPerson = person;
              if (!newPerson.Room_Name) {
                newPerson.Room_Name = '';
              }
              newPerson.Room_Name = person.Room_Name.replace(/_/g, ' ');
              this.personsFound.push(newPerson);
            }

            this.error = null;
            this.response_received = true;
            this.triedRefreshingSession = false;
          },
          async (response) => {
            if (!this.triedRefreshingSession) {
              if (response.status === 401) {
                // refresh token expired; f.e. if user logs into a second device
                this.refreshToken(true);
              } else {
                this.error = response;
                this.response_received = true;
              }
            } else {
              this.error = response;
              this.response_received = true;
            }
          }
        );

      if (this.personsFound.length > 0) {
        this.noResults = false;
      } else {
        this.noResults = true;
      }
    } else {
      // this.logger.debug('search', 'empty query');
      this.response_received = true;
      this.noResults = true;
    }
  }

  openMail(mail) {
    window.location.href = 'mailto:' + mail;
  }

  getNameString(person) {
    let s = '';

    if (person.Initials) {
      s += person.Initials;
    }

    if (person.First_Name) {
      s += ' ' + person.First_Name;
    }

    if (person.Last_Name) {
      s += ' ' + person.Last_Name;
    }

    return s.trim();
  }

  /**
   * @name callContact
   * @description using native call for calling numbers
   * @param {string} number
   * https://www.javascripttuts.com/making-phone-calls-to-contacts-with-ionic-in-one-go/
   */
  callContact(num: string) {
    window.location.href = 'tel:' + num;
  }

  refreshToken(searchAfterRefresh?: boolean) {
    if (
      this.session &&
      this.session.credentials &&
      this.session.credentials.password &&
      this.session.credentials.username
    ) {
      // this.logger.debug('refreshToken', 're-authenticating...');
      const oidcObject = ConfigService.isApiManagerUpdated
        ? ConfigService.config.authorization.oidc_new
        : ConfigService.config.authorization.oidc;
      this.login.oidcLogin(this.session.credentials, oidcObject).subscribe(
        (sessionRes) => {
          // this.logger.debug('refreshToken', 're-authenticating successfull');
          this.sessionProvider.setSession(sessionRes);
          this.session = sessionRes;
          if (searchAfterRefresh) {
            this.triedRefreshingSession = true;
            this.search();
          } else {
            this.triedRefreshingSession = false;
          }
        },
        (error) => {
          // this.logger.error(
          //   'refreshToken',
          //   're-authenticating not possible',
          //   error
          // );
        }
      );
    }
  }
}
