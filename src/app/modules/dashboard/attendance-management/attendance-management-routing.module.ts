import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AttendanceManagementComponent } from './attendance-management.component';

const routes: Routes = [
  { path : '', component : AttendanceManagementComponent, pathMatch : 'full'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AttendanceManagementRoutingModule { }
