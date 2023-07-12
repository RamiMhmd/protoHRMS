import { Component, OnDestroy, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from 'src/app/core/services/user.service';
import { AttendanceService } from 'src/app/core/services/attendance.service';
import { CommonService } from 'src/app/core/services/common.service';
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
  selector: 'app-employee-edit-modal',
  templateUrl: './employee-edit-modal.component.html',
  styleUrls: ['./employee-edit-modal.component.css']
})
export class EmployeeEditModalComponent implements OnInit, OnDestroy {
  @Input() userId!: any;
  @Input() selfUpdate!: boolean;
  @Input() userrole !: any;

  private objDestroyed$ = new Subject();
  aryManagerList: any = [];
  blnShowSpinner: boolean = false;
  usrDetail: any;
  userItemId: any;
  browser: string ="Chrome";
  objEmployeeForm: FormGroup = this.objFormBuilder.group({
    employeeName: this.objFormBuilder.control('', [Validators.required]),
    email: this.objFormBuilder.control({ value: '', disabled: true }),
    role: this.objFormBuilder.control({ value: '', disabled: true }),
    groupName: this.objFormBuilder.control({ value: '', disabled: true }),
    manager: this.objFormBuilder.control({ value: '', disabled: true }),
  });

  constructor(
    private objFormBuilder: FormBuilder,
    public objActiveModal: NgbActiveModal,
    private objUserService: UserService,
    private objAttendanceService: AttendanceService,
    private objCommonService: CommonService,
    private deviceService: DeviceDetectorService
  ) { }

  ngOnInit(): void {
    this.getManagerRoleUsers();
    if (this.userId) {
      this.blnShowSpinner = true;
      this.populateItem();
    }
    this.getBrowserName();
  }

  ngOnDestroy(): void {
    this.objDestroyed$.next(void 0);
    this.objDestroyed$.complete();
  }
  getBrowserName() {
    this.browser = this.deviceService.browser;
  }
  /**
   * @description : To close the employee edit modal
   * @returns null
   */
  openCloseModal(status: any) {
    if (status === 3)
      this.objActiveModal.close(3);
    else
      this.objActiveModal.dismiss();
  }

  /**
   * @description : To get the list of employees with 'Manager' role
   * @returns null
   */
  getManagerRoleUsers() {
    this.objUserService.listAllManagerRoles().pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.aryManagerList = objResponse.role_users;
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
  }

  /**
   * @description : To get the details of the employee and show them in the modal
   * @returns null
   */
  populateItem() {
    const params = {
      "conditions": [{ "id": "User_id", "search_value": [this.userId], "exact_match": true }],
      "page": 1,
      "per_page": 0,
      "use_display_id": true,
      "return_number_value": true
    }
    this.objUserService.listAllUsers(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse1: any) => {
        this.usrDetail = objResponse1.items[0];
        this.userItemId = this.usrDetail.i_id;
        this.objEmployeeForm.controls['employeeName'].setValue(this.usrDetail.Username);
        this.objEmployeeForm.controls['email'].setValue(this.usrDetail.Email);
        this.objEmployeeForm.controls['role'].setValue(this.usrDetail.Role);
        if (this.usrDetail.Role == 2) {
          this.objUserService.getChildGroupId(this.usrDetail.Group_id).pipe(takeUntil(this.objDestroyed$)).subscribe({
            next: (objResponse: any) => {
              this.objEmployeeForm.controls['groupName'].setValue(objResponse.group.name);
              this.blnShowSpinner = false;
            },
            error: () => {
              this.blnShowSpinner = false;
              this.objCommonService.showError('Error.Please try after some times')
            }
          })
        }
        else if (this.usrDetail.Role == 3) {
          this.objEmployeeForm.controls['manager'].setValue(this.usrDetail.Manager_Id);
          this.blnShowSpinner = false;
        }else{
          this.blnShowSpinner = false;
        }
      },
      error: () => {
        this.blnShowSpinner = false;
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
  }

  /**
   * @description : To update the details of the employee
   * @returns null
   */
  updateUser() {
    this.blnShowSpinner = true;
    if (this.selfUpdate) {
      const params = {
        "user_id": this.userId,
        "username": this.objEmployeeForm.controls['employeeName'].value
      }
      this.objUserService.updateProfile(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
        next: (objResponse: any) => {
          if (objResponse) {
            const paramsUser = {
              "item": {
                "Username": this.objEmployeeForm.controls['employeeName'].value
              },
              "use_display_id": true,
              "is_force_update": true
            }
            this.objUserService.updateUser(paramsUser, this.userItemId).pipe(takeUntil(this.objDestroyed$)).subscribe({
              next: (objResponse1: any) => {
                this.updateUsernameInAttendance();
              }, error: () => {
                this.objCommonService.showError('Error.Please try after some times')
              }
            })
          }
        },
        error: () => {
          this.blnShowSpinner = false;
          this.objCommonService.showError('Error.Please try after some times')
        }
      })
    }
    else {
      this.openCloseModal(0);
    }
  }

  /**
   * @description: If the hexabase username changes, update the username in attendance records up to 300 if they are present in attendance table.
   * @returns null
   */
  updateUsernameInAttendance() {
    const params = {
      "conditions": [
        {
          "id": "Emp_id",
          "search_value": [this.usrDetail.User_id],
          "exact_match": true
        }
      ],
      "item": {
        "Emp_name": this.objEmployeeForm.controls['employeeName'].value
      },
      "max_items": 300,
      "use_display_id": true,
      "continue_proc": true,
    }
    this.objAttendanceService.bulkUpdateAttendance(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        if (objResponse) {
          this.blnShowSpinner = false;
          this.openCloseModal(3);
        }
      },
      error: () => {
        this.blnShowSpinner = false;
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
  }

}