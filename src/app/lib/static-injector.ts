import { Injector } from '@angular/core';

// https://robferguson.org/blog/2018/09/28/ionic-3-component-inheritance/
export class StaticInjectorService {

    private static injector: Injector;

    static setInjector(injector: Injector) {
        StaticInjectorService.injector = injector;
    }

    static getInjector(): Injector {
        return StaticInjectorService.injector;
    }
}
