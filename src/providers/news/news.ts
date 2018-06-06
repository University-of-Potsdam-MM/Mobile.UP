import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class NewsProvider {

  constructor(public http: HttpClient) {
  }

  public getNews(): Observable<any> {
    var url = "https://musang.soft.cs.uni-potsdam.de/potsdamevents/json/news/";
    return this.http.get(url);
  }

}
