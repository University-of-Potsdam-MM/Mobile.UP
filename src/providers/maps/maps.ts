import { Injectable } from '@angular/core';
import { LaunchNavigator, LaunchNavigatorOptions, AppSelectionOptions, PromptsOptions, RememberChoiceOptions } from '@ionic-native/launch-navigator/ngx';
import { TranslateService } from '@ngx-translate/core';
import { WebIntentProvider } from '../web-intent/web-intent';

@Injectable()
export class MapsProvider {

  private promptsOptions:PromptsOptions = {
    "headerText": "Auswahl merken?",
    "bodyText": "Beim nächsten Mal die gleiche App verwenden?",
    "yesButtonText": "Ja",
    "noButtonText": "Nein"
  }

  private rememberChoiceOptions:RememberChoiceOptions = {
    "prompt": this.promptsOptions
  }

  private appSelectionOptions:AppSelectionOptions = {
    "dialogHeaderText": "App zur Navigation auswählen...",
    "cancelButtonText": "Abbrechen",
    "rememberChoice": this.rememberChoiceOptions
  }

  private options:LaunchNavigatorOptions = {
    "appSelection": this.appSelectionOptions
  }

  constructor(private translate: TranslateService,
              private webIntent: WebIntentProvider,
              private launchNavigator: LaunchNavigator) {
  }

  protected ngOnInit() {
    this.promptsOptions = {
      "headerText": this.translate.instant("launchNavigator.headerText"),
      "bodyText": this.translate.instant("launchNavigator.bodyText"),
      "yesButtonText": this.translate.instant("button.yes"),
      "noButtonText": this.translate.instant("button.no")
    }

    this.appSelectionOptions = {
      "dialogHeaderText": this.translate.instant("launchNavigator.dialogHeaderText"),
      "cancelButtonText": this.translate.instant("button.cancel")
    }
  }

  public navigateToAdress(location:string) {
    this.launchNavigator.navigate(location, this.options).then(success => {
      console.log("Launched navigator");
    }, error => {
      console.log("Error launching navigator: ", error);
      this.webIntent.permissionPromptWebsite('https://maps.google.com/?q='+location);
    });
  }

  public navigateToLatLong(latLong:number[]) {
    this.launchNavigator.navigate(latLong, this.options).then(success => {
      console.log("Launched navigator");
    }, error => {
      console.log("Error launching navigator: ", error);
      this.webIntent.permissionPromptWebsite('https://maps.google.com/?q='+String(latLong[0])+","+String(latLong[1]));
    });
  }

}
