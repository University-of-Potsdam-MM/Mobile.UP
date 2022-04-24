import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppInfoPage } from './app-info.page';

const routes: Routes = [
  {
    path: '',
    component: AppInfoPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppInfoPageRoutingModule {}
