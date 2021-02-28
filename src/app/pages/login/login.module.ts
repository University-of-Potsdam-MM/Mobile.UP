import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { LoginPage } from "./login.page";
import { LoginModule } from "./login.import";

const routes: Routes = [
  {
    path: "",
    component: LoginPage,
  },
];

@NgModule({
  imports: [LoginModule, RouterModule.forChild(routes)],
  declarations: [],
})
export class LoginPageModule {}
