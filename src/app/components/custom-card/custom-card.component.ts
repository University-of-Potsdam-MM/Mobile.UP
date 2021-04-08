import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { WebIntentService } from 'src/app/services/web-intent/web-intent.service';

@Component({
  selector: 'app-custom-card',
  templateUrl: './custom-card.component.html',
  styleUrls: ['./custom-card.component.scss'],
})
export class CustomCardComponent implements OnInit {
  // header
  @Input() headerTitle: string;
  @Input() headerNote: string;
  @Input() headerIcon: string;
  @Output() headerIconCallback = new EventEmitter();

  // card header
  @Input() cardTitle: string;
  @Input() cardSubTitle: string;

  // card content
  @Input() cardContent: string;
  @Input() cardNote: string;

  // footer
  @Input() footerFirstString: string;
  @Input() footerFirstIcon: string;
  @Output() footerFirstIconCallback = new EventEmitter();

  @Input() footerSecondString: string;
  @Input() footerSecondIcon: string;
  @Output() footerSecondIconCallback = new EventEmitter();

  @Input() footerThirdString: string;
  @Input() footerThirdIcon: string;
  @Output() footerThirdIconCallback = new EventEmitter();

  // url
  @Input() url: string;

  constructor(private web: WebIntentService) {}

  ngOnInit() {}

  openURL(url?: string) {
    if (url && url !== '') {
      this.web.permissionPromptWebsite(url);
    }
  }

  clickHeaderIcon($event) {
    $event.stopPropagation();
    this.headerIconCallback.emit();
  }

  clickFooterFirstIcon($event) {
    $event.stopPropagation();
    this.footerFirstIconCallback.emit();
  }

  clickFooterSecondIcon($event) {
    $event.stopPropagation();
    this.footerSecondIconCallback.emit();
  }

  clickFooterThirdIcon($event) {
    $event.stopPropagation();
    this.footerThirdIconCallback.emit();
  }
}
