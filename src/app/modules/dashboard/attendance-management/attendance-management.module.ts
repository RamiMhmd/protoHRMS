import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AttendanceManagementRoutingModule } from './attendance-management-routing.module';
import { AttendanceManagementComponent } from './attendance-management.component';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { setTheme } from 'ngx-bootstrap/utils';
setTheme('bs4')
import { AttendanceModalComponent } from './attendance-modal/attendance-modal.component';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [
    AttendanceManagementComponent,
    AttendanceModalComponent
  ],
  imports: [
    CommonModule,
    AttendanceManagementRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModule,
    BsDatepickerModule.forRoot(),
  ]
})
export class AttendanceManagementModule { }
