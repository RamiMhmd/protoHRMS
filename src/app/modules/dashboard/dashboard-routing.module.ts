import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

const routes: Routes = [
  { path : '', component : DashboardComponent, children : [
    { path : '', redirectTo : 'attendance', pathMatch : 'full'},
    { path : 'employee', loadChildren: ()=> import('./employee-management/employee-management.module').then(m => m.EmployeeManagementModule)},
    { path : 'attendance', loadChildren: ()=> import('./attendance-management/attendance-management.module').then(m => m.AttendanceManagementModule)},

  ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule { }
