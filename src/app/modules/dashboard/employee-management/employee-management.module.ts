import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EmployeeManagementRoutingModule } from './employee-management-routing.module';
import { EmployeeManagementComponent } from './employee-management.component';
import { EmployeeModalComponent } from './employee-modal/employee-modal.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { EmployeeEditModalComponent } from './employee-edit-modal/employee-edit-modal.component';
import { UpdateManagerComponent } from './update-manager/update-manager.component';

@NgModule({
  declarations: [
    EmployeeManagementComponent,
    EmployeeModalComponent,
    EmployeeEditModalComponent,
    UpdateManagerComponent
  ],
  imports: [
    CommonModule,
    EmployeeManagementRoutingModule,
    NgbModule,
    ReactiveFormsModule,
    FormsModule,
    EmployeeManagementRoutingModule
  ]
})
export class EmployeeManagementModule { }
