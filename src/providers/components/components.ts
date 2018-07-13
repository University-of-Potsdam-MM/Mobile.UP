import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {Observable} from "rxjs/Observable";

export interface IModule {
  name:string;
  componentName:string;
  i18nKey:string;
  icon:string;
}

/**
 *
 */
@Injectable()
export class ComponentsProvider {

  components:{[componentName:string]:any} = {};
  modules:IModule[] = [];


  constructor(public http: HttpClient) {}

  setComponents(components){
    this.components = components;
  }

  getComponent(componentName:string):Observable<any>{
    return Observable.create(
      observer => {
        try {
          observer.next(this.components[componentName]);
        } catch(error) {
          observer.error(error);
        }
      }
    )
  }
}
