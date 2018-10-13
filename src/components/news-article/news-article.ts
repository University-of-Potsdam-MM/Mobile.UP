import { Component, Input } from '@angular/core';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { SafariViewController } from '@ionic-native/safari-view-controller';
import { Platform } from 'ionic-angular/platform/platform';

@Component({
  selector: 'news-article',
  templateUrl: 'news-article.html'
})
export class NewsArticleComponent {

  @Input() public article;

  constructor(private iap: InAppBrowser, private safari: SafariViewController, private platform: Platform) {

    // hides images that could not be loaded (404)
    // maybe show an replacement image in the future?
    const list = document.getElementsByTagName("img");

    var i;
    for (i = 0; i < list.length; i++)
    list[i].onerror = function() {
      this.style.display = "none";
    };

  }

  openWebsite(link) {
    if (this.platform.is("cordova")) {
      this.safari.isAvailable().then((available:boolean) => {
        if (available) {
          this.openWithSafari(link);
        } else { this.openWithInAppBrowser(link); }
      });
    } else { this.openWithInAppBrowser(link); }
  }

  openWithInAppBrowser(url:string) {
    let target = "_blank";
    this.iap.create(url,target);
  }

  openWithSafari(url:string) {
    this.safari.show({
      url: url
    }).subscribe(result => {console.log(result);}, error => { console.log(error); })
  }


}
