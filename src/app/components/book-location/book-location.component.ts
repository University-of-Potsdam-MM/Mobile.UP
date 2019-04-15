import { Component, OnInit, Input } from '@angular/core';
import * as moment from 'moment';
import { utils, WebHttpUrlEncodingCodec } from '../../lib/util';
import { WebIntentService } from '../../services/web-intent/web-intent.service';
import { ConfigService } from '../../services/config/config.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { IConfig } from '../../lib/interfaces';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-book-location',
  templateUrl: './book-location.component.html',
  styleUrls: ['./book-location.component.scss']
})
export class BookLocationComponent implements OnInit {

  @Input() bookLocation;
  @Input() mediaType;
  @Input() department;

  departmentName;
  departmentURL;
  label;
  item;
  url;
  roomURL;
  isLoaded = false;

  constructor(
    private http: HttpClient,
    private translate: TranslateService,
    public webIntent: WebIntentService // is used in the HTML
  ) { }

  ngOnInit() {
    this.isLoaded = false;
    this.departmentName = this.getDepartment(this.department);
    this.departmentURL = this.getDepartmentURL(this.department);
    this.label = this.getLabel(this.department);
    this.item = this.getItem(this.department);
    this.url = this.getBookUrl(this.department);
    this.getRoomInfo();
  }

  getRoomInfo() {
    const epn = this.getEPN();
    if (epn && this.label && this.label !== 'bestellt'
    && this.departmentName.trim() !== 'Handapparat'
    && this.departmentName.trim() !== 'Universität Potsdam, Universitätsbibliothek') {
      const config: IConfig = ConfigService.config;
      const params = new HttpParams({encoder: new WebHttpUrlEncodingCodec()}).append('epn', epn);

      this.http.get(config.webservices.endpoint.libraryLKZ, {params: params}).subscribe(data => {
        const lkz = data['msg'];
        if (lkz && lkz !== 'no results' && lkz !== 'parameter incorrect') {
          let url = 'https://uni-potsdam.mapongo.de/viewer?search_key=' + encodeURI(this.label);
          url += '&search_context2=' + lkz + '&language=' + this.translate.currentLang + '&project_id=1';
          this.roomURL = url;
        }

        this.isLoaded = true;
      }, error => {
        console.log('[Library]: Could not get LKZ');
        console.log(error);
        this.isLoaded = true;
      });
    } else { this.isLoaded = true; }
  }

  getEPN() {
    const epn = this.department.id.split('epn:')[1];
    return epn;
  }

  /**
   * @name getDepartment
   * @param item
   */
  getDepartment(item) {
    let department = '';
    if (item.department && item.department.content) {
      department = item.department.content;
    }
    if (item.storage) {
      department = department + ', ' + item.storage.content;
    }
    return department;
  }

  /**
   * @name getDepartmentURL
   * @param item
   */
  getDepartmentURL(item) {
    if (item.department && item.department.id) {
      return item.department.id;
    } else { return ''; }
  }

  /**
   * @name getLabel
   * @param item
   */
  getLabel(item) {
    if (item.label) {
      return item.label;
    } else { return ''; }
  }

  /**
   * @name getItem
   * @param item
   */
  getItem(item) {
    let status = '', statusInfo = '';

    // check for available / unavailable items and process loan and presentation
    let loanAvailable, presentationAvailable;
    if (item.available) {
      // tslint:disable-next-line:no-var-keyword
      const availableArray = utils.convertToArray(item.available);
      loanAvailable = availableArray.find(x => x.service === 'loan');
      presentationAvailable = availableArray.find(x => x.service === 'presentation');
    }

    let loanUnavailable, presentationUnavailable;
    if (item.unavailable) {
      const unavailableArray = utils.convertToArray(item.unavailable);
      loanUnavailable = unavailableArray.find(x => x.service === 'loan');
      presentationUnavailable = unavailableArray.find(x => x.service === 'presentation');
    }

    if (loanAvailable) {
      status = 'ausleihbar';

      if (presentationAvailable) {
        // tag available with service="loan" and href=""?
        if (presentationAvailable.limitation) {
          statusInfo = presentationAvailable.limitation[0].content;
        }

        if (loanAvailable.href === '') {
          statusInfo = statusInfo + 'Bitte bestellen';
        }
      }
    } else {
      // check for loan in unavailable items
      // indicates LBS and Online-Resources
      if (loanUnavailable && loanUnavailable.href) {
        if (loanUnavailable.href.indexOf('loan/RES') !== -1) {
          status = 'ausleihbar';
        } else { status = 'nicht ausleihbar'; }
      } else {
        // if there is no url then it will be a presentation
        if (this.getBookUrl(item) == null) {
          if (item.label && item.label.indexOf('bestellt') !== -1) {
            status = item.label;
            statusInfo = '';
          } else {
            status = 'Präsenzbestand';
            if (presentationAvailable.limitation) {
              statusInfo = presentationAvailable.limitation[0].content;
            }
          }
        } else {
          status = 'Online-Ressource im Browser öffnen';
        }
      }

      if (presentationUnavailable) {
        if (loanUnavailable && loanUnavailable.href) {
          if (loanUnavailable.href.indexOf('loan/RES') !== -1) {
            status = 'ausgeliehen';
            if (!loanUnavailable.expected || loanUnavailable.expected === 'unknown') {
              statusInfo = statusInfo + 'ausgeliehen, Vormerken möglich';
            } else {
              statusInfo = statusInfo + 'ausgeliehen bis ';
              statusInfo = statusInfo + moment(loanUnavailable.expected, 'YYYY-MM-DD').format('DD.MM.YYYY');
              statusInfo = statusInfo + ', vormerken möglich';
            }
          }
        } else {
          statusInfo = statusInfo + '...';
        }
      }
    }

    return [status, statusInfo];
  }

  /**
   * @name getBookUrl
   * @param item
   */
  getBookUrl(item): void {
    let url;
    if (this.bookLocation) {
      let i;
      const tmp = utils.convertToArray(this.bookLocation);
      for (i = 0; i < tmp.length; i++) {
        if (tmp[i].url) {
          const tmpUrl = utils.convertToArray(tmp[i].url);
          let j;
          for (j = 0; j < tmpUrl.length; j++) {
            if (tmpUrl[j].$ && (tmpUrl[j].$.usage === 'primary display')) {
              if (tmpUrl[j]._) {
                url = tmpUrl[j]._;
                break;
              }
            }
          }
        }
      }
    }

    if (this.mediaType === 'mediatype_o') {
      let tmp;
      if (item.unavailable && item.unavailable[0].service === 'openaccess') {
        tmp = item.unavailable[0].href;
      } else { tmp = null; }
      if (tmp != null) { url = tmp; }
    }

    return url;
  }

}