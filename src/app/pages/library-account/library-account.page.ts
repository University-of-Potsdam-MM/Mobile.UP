import { Component, OnInit } from '@angular/core';
import { IUBUser, IUBFees, IUBItems, IUBItem } from 'src/app/lib/interfaces';
import { AbstractPage } from 'src/app/lib/abstract-page';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-library-account',
  templateUrl: './library-account.page.html',
  styleUrls: ['./library-account.page.scss'],
})
export class LibraryAccountPage extends AbstractPage implements OnInit {

  user: IUBUser = {
    'name': 'Max G. Mustermann',
    'email': 'mustermann@example.org',
    'address': 'Hauptstraße 15, Buxhausen',
    'expires': '2015-05-18',
    'status': 0,
    'type': ['http://example.org/usertypes/default']
  };

  fees: IUBFees = {
    amount: '2.98 EUR',
    fee: [{
      'amount': '0.99 EUR',
      'date': '2016-06-20',
      'about': 'FEE TEXT',
      'item': 'URI ITEM',
      'edition': 'URI EDITION',
      'feetype': 'SERVICE',
      'feeid': 'URI'
    }, {
      'amount': '1.99 EUR',
      'date': '2016-06-20',
      'about': 'FEE TEXT2',
      'item': 'URI ITEM2',
      'edition': 'URI EDITION2',
      'feetype': 'SERVICE2',
      'feeid': 'URI2'
    }]
  };

  items: IUBItems = {
    'doc': [{
      'status': 3,
      'item': 'http://bib.example.org/105359165',
      'edition': 'http://bib.example.org/9782356',
      'about': 'Maurice Sendak (1963): Where the wild things are',
      'label': 'Y B SEN 101',
      'queue': 0,
      'renewals': 0,
      'reminder': 0,
      'starttime': '2014-05-08T12:37Z',
      'endtime': '2019-06-09',
      'cancancel': false,
      'canrenew': true,
      }, {
      'status': 3,
      'item': 'http://bib.example.org/8861930',
      'about': 'Janet B. Pascal (2013): Who was Maurice Sendak?',
      'label': 'BIO SED 03',
      'queue': 0,
      'starttime': '2014-05-12T18:07Z',
      'endtime': '2019-05-24',
      'cancancel': true,
      'storage': 'pickup service desk',
      'storageid': 'http://bib.example.org/library/desk/7'
      }, {
      'status': 3,
      'item': 'http://bib.example.org/8861930',
      'about': 'Hattori H. Hanzo (1503): Learn Japanese in 3 Hours',
      'label': 'EDU SED 01',
      'queue': 0,
      'starttime': '2014-05-12T18:07Z',
      'endtime': '2015-01-01',
      'cancancel': true,
      'canrenew': true,
      'storage': 'pickup service desk',
      'storageid': 'http://bib.example.org/library/desk/1'
      }, {
      'status': 1,
      'item': 'http://bib.example.org/8831930',
      'about': 'Aaron Aaranovitch (2010): Die Flüsse von London',
      'label': 'ROM FAN 110',
      'queue': 1,
      'starttime': '2017-01-12T18:07Z',
      'endtime': '2017-01-18',
      'storage': 'pickup service desk',
      'storageid': 'http://bib.example.org/library/desk/7'
    }]
  };

  itemStatus = [];
  grayedOutItemsHint;
  userLoaded;
  itemsLoaded;
  feesLoaded;
  noLoanItems = true;

  constructor(
    private translate: TranslateService
  ) {
    super({ requireSession: true, requireNetwork: true });
  }

  ngOnInit() {
    this.getUser();
    this.getItems();
    this.getFees();
  }

  getUser() {
    this.userLoaded = false;
    // TODO: http get items
    this.userLoaded = true;
  }

  getItems() {
    this.itemsLoaded = false;
    // TODO: http get items
    this.itemsLoaded = true;
    this.prepareForm();
  }

  getFees() {
    this.feesLoaded = false;
    // TODO: http get items
    this.feesLoaded = true;
  }

  refresh(refresher) {
    this.getUser();
    this.getItems();
    this.getFees();
    setTimeout(() => {
      refresher.target.complete();
    }, 1000);
  }

  renewItems() {
    for (let i = 0; i < this.items.doc.length; i++) {
      if (this.itemStatus[i].isChecked) {
        this.renewRequest(this.items.doc[i]);
      }
    }
  }

  renewRequest(item: IUBItem) {
    console.log('[UB-Account]: Renew item ' + item.about);

    // TODO: http renew request
  }

  prepareForm() {
    for (let i = 0; i < this.items.doc.length; i++) {
      if (this.items.doc[i].status === 3) { this.noLoanItems = false; }

      let renewable;
      if ((this.items.doc[i].queue !== 0) || !this.items.doc[i].canrenew) {
        // item can not be renewed
        renewable = false;
      } else if (this.items.doc[i].canrenew) { renewable = true; }

      if (!renewable) { this.grayedOutItemsHint = true; }

      const endDate = moment(this.items.doc[i].endtime);
      const currentDate = moment();
      const dayDiff = endDate.diff(currentDate, 'days');

      let status;
      if (dayDiff < 0) {
        status = 2;
      } else if (dayDiff < 15) {
        status = 1;
      } else { status = 0; }

      this.itemStatus[i] = {
        'isChecked': false,
        'isRenewable': renewable,
        // status: 0 = ok, 1 = due soon, 2 = late
        'status': status,
        'daysToReturn': dayDiff
      };
    }
  }

  validateCheckboxes() {
    let checked = false;
    for (const status of this.itemStatus) {
      if (status.isChecked) {
        checked = true;
        break;
      }
    }

    return !checked;
  }

  formatItemDates(date) {
    let tmp;
    if (this.translate.currentLang === 'de') {
      tmp = moment(date).format('DD.MM.YYYY');
    } else { tmp = moment(date).format('L'); }
    return tmp;
  }

}
