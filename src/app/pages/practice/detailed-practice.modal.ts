import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { WebIntentService } from 'src/app/services/web-intent/web-intent.service';
import { IConfig } from 'src/app/lib/interfaces';
import { ConfigService } from 'src/app/services/config/config.service';

@Component({
  selector: 'detailed-practice-modal-page',
  templateUrl: './detailed-practice.modal.html',
})
export class DetailedPracticeModalPage implements OnInit {

  @Input() ADS;
  URLEndpoint;

  constructor(
      private modalCtrl: ModalController,
      private webIntent: WebIntentService
    ) {
  }

  ngOnInit() {
    const config: IConfig = ConfigService.config;
    this.URLEndpoint = config.webservices.endpoint.practiceJobPostings;
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  openPdfLink(fileLink: string) {
    this.webIntent.permissionPromptWebsite(this.URLEndpoint + fileLink);
  }

}
