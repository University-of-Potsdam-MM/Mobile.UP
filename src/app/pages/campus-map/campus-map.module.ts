import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Routes, RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { CampusMapPage } from "./campus-map.page";
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { HttpClient } from "@angular/common/http";
import { ComponentsModule } from "src/app/components/components.module";
import { HttpLoaderFactory } from "src/app/app.module";
import { LeafletModule } from "@asymmetrik/ngx-leaflet";

const routes: Routes = [
  {
    path: "",
    component: CampusMapPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComponentsModule,
    LeafletModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    RouterModule.forChild(routes),
  ],
  declarations: [CampusMapPage],
})
export class CampusMapPageModule {}
