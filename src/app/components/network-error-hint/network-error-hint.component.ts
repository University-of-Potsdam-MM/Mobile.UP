import { Component, OnInit, Input } from "@angular/core";
import { ConnectionService } from "src/app/services/connection/connection.service";
import { Storage } from "@ionic/storage";

@Component({
  selector: "app-network-error-hint",
  templateUrl: "./network-error-hint.component.html",
  styleUrls: ["./network-error-hint.component.scss"],
})
export class NetworkErrorHintComponent implements OnInit {
  hasInternet;
  error;
  showError = false;

  constructor(
    private connectionService: ConnectionService,
    private storage: Storage
  ) {}

  async ngOnInit() {
    this.hasInternet = this.connectionService.checkOnline();

    if (this.hasInternet) {
      this.error = await this.storage.get("latestWebserviceError");
    }
  }

  showErrorDetails() {
    this.showError = !this.showError;
  }
}
