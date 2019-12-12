import { Component, OnInit, Input } from '@angular/core';
import { ConnectionService } from 'src/app/services/connection/connection.service';

@Component({
  selector: 'app-network-error-hint',
  templateUrl: './network-error-hint.component.html',
  styleUrls: ['./network-error-hint.component.scss'],
})
export class NetworkErrorHintComponent implements OnInit {

  hasInternet;

  constructor(
    private connectionService: ConnectionService
  ) { }

  ngOnInit() {
    this.hasInternet = this.connectionService.checkOnline();
  }

}
