import { Component, OnInit } from '@angular/core';
import { ConnectionService } from 'src/app/services/connection/connection.service';
import { Storage } from '@capacitor/storage';

@Component({
  selector: 'app-network-error-hint',
  templateUrl: './network-error-hint.component.html',
  styleUrls: ['./network-error-hint.component.scss'],
})
export class NetworkErrorHintComponent implements OnInit {
  hasInternet;
  error;

  constructor(private connectionService: ConnectionService) {}

  async ngOnInit() {
    this.hasInternet = await this.connectionService.checkOnline();

    if (this.hasInternet) {
      const errorObj = await Storage.get({ key: 'latestWebserviceError' });
      this.error = JSON.parse(errorObj.value);
    }
  }
}
