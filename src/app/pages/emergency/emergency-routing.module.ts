import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EmergencyPage } from './emergency.page';

const routes: Routes = [
  {
    path: '',
    component: EmergencyPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmergencyPageRoutingModule {}
