import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Routes, RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { LibraryAccountPage } from "./library-account.page";
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { HttpLoaderFactory } from "src/app/app.module";
import { HttpClient } from "@angular/common/http";
import { ComponentsModule } from "src/app/components/components.module";
import { LibraryPwChangePage } from "./library-pw-change.module";

const routes: Routes = [
  {
    path: "",
    component: LibraryAccountPage,
  },
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ComponentsModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    RouterModule.forChild(routes),
  ],
  declarations: [LibraryAccountPage, LibraryPwChangePage],
  entryComponents: [LibraryPwChangePage],
})
export class LibraryAccountPageModule {}
