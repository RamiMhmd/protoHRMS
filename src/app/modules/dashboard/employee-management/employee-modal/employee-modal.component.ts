import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from 'src/app/core/services/user.service';
import { CommonService } from 'src/app/core/services/common.service';
import { AppConstants } from 'src/app/core/constants/common.constants';
import { environment } from 'src/environments/environment';
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
  selector: 'app-employee-modal',
  templateUrl: './employee-modal.component.html',
  styleUrls: ['./employee-modal.component.css']
})
export class EmployeeModalComponent implements OnInit, OnDestroy {

  public getScreenWidth: any;
  public getScreenHeight: any;
  private objDestroyed$ = new Subject();
  private workspace_id = environment.workspace_id;
  aryManagerList: any = [];
  intPageNumber: number = 1;
  initPageSize: number = 0;
  intParentGroupId !: number;
  intChildGroupId !: number;
  intManagerId !: number;
  blnShowSpinner: boolean = false;
  browser: string = "Chrome";
  isUpdateUser: boolean = false;
  userItemId: any;
  objEmployeeForm: FormGroup = this.objFormBuilder.group({
    email: this.objFormBuilder.control('', [Validators.required, Validators.pattern(AppConstants.REGEX_EMAIL)]),
    role: this.objFormBuilder.control(1, [Validators.required]),
    groupName: this.objFormBuilder.control('', [Validators.required]),
    manager: this.objFormBuilder.control('0'),
  });

  constructor(
    private objFormBuilder: FormBuilder,
    public objAddModal: NgbActiveModal,
    private objUserService: UserService,
    private objCommonService: CommonService,
    private deviceService: DeviceDetectorService
  ) { }

  ngOnInit(): void {
    this.getManagerRoleUsers();
    this.handleRoleChange();
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
    this.getBrowserName();
  }
  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.getScreenWidth = window.innerWidth;
    this.getScreenHeight = window.innerHeight;
  }

  ngOnDestroy(): void {
    this.objDestroyed$.next(void 0);
    this.objDestroyed$.complete();
  }
  getBrowserName() {
    this.browser = this.deviceService.browser;
  }
  /**
   * @description : To close or dismiss the add employee modal
   * @returns null
   */
  openCloseModal(intStatus: any) {
    if (intStatus === 1) {
      this.objAddModal.close(1)
    }
    else
      this.objAddModal.dismiss()
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
   * @description : To catch the change event of 'Role' dropdown for arranging other controls in the modal
   * @returns null
   */
  handleRoleChange() {
    this.objEmployeeForm.controls['role'].valueChanges.pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (intValue: any) => {
        if (intValue == 1) {
          this.objEmployeeForm.controls['manager'].removeValidators([Validators.required])
          this.objEmployeeForm.controls['manager'].updateValueAndValidity()
          this.objEmployeeForm.controls['groupName'].addValidators([Validators.required])
          this.objEmployeeForm.controls['groupName'].updateValueAndValidity()
        } else {
          this.objEmployeeForm.controls['groupName'].removeValidators([Validators.required])
          this.objEmployeeForm.controls['groupName'].updateValueAndValidity()
          this.objEmployeeForm.controls['manager'].addValidators([Validators.required])
          this.objEmployeeForm.controls['manager'].updateValueAndValidity()
        }
      }
    })
  }

  /**
   * @description : To get the Group details of the selected manager
   * @param event: the change event of 'Manager' dropdown
   * @returns null
   */
  getManagerDetails(event: any) {
    this.intManagerId = event.target.value
    const params = {
      "conditions": [{ "id": "User_id", "search_value": [event.target.value], "exact_match": true }],
      "page": this.intPageNumber,
      "per_page": 0,
      "use_display_id": true,
      "return_number_value": true
    }
    this.objUserService.listAllUsers(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.intParentGroupId = objResponse.items[0].Group_id;
        this.getChildGroupId(objResponse.items[0].Group_id);
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times')
      }
    })

  }

  /**
   * @description : To get the childGroup_id of the selected manager
   * @param parentGroupId: the Group_id of the manager from 'Manager' dropdown
   * @returns null
   */
  getChildGroupId(parentGroupId: any) {
    this.objUserService.getChildGroupId(parentGroupId).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.intChildGroupId = objResponse.children[0].g_id;
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
  }

  /**
   * @description : To add the new employee to the workspace and group
   * @returns null
   */
  addUserToWorkspace() {
    const body = {
      "email": this.objEmployeeForm.controls['email'].value,
      "g_id": this.objEmployeeForm.controls['role'].value == 1 ? this.intParentGroupId : this.intChildGroupId,
      "w_id": this.workspace_id
    }
    this.objUserService.addUserToWorkspace(body).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        if (objResponse.user_profile.confirmed === false) {
          this.objCommonService.showError('Email id not found');
          if (this.objEmployeeForm.controls['role'].value == 1) {
            this.deleteGroup(this.intParentGroupId);
          } else if (this.objEmployeeForm.controls['role'].value == 2) {
            this.deleteUser(objResponse.user_profile.u_id, this.intChildGroupId);
          }
          this.blnShowSpinner = false;
        } else {
          this.addRoleToUser(objResponse.user_profile.u_id, objResponse.user_profile.username, this.objEmployeeForm.controls['role'].value == 1 ? "MANAGER" : "USER")
        }
      },
      error: () => {
        if (this.objEmployeeForm.controls['role'].value == 1) {
          this.deleteGroup(this.intParentGroupId);
        }
        this.objCommonService.showError('Error.Please try after some times');
        this.blnShowSpinner = false;
      }
    })
  }

  /**
   * @description : To assign role to the new employee 
   * @returns null
   */
  addRoleToUser(userId: any, username: any, role: any) {
    const body = {
      "user_id": userId,
      "role_id": role
    }
    this.objUserService.addRoleToUser(body).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: () => {
        this.addUserToDatabase(userId, username);
      },
      error: () => {
        if (this.objEmployeeForm.controls['role'].value == 1) {
          this.deleteGroup(this.intParentGroupId);
        } else if (this.objEmployeeForm.controls['role'].value == 2) {
          this.deleteUser(userId, this.intChildGroupId);
        }
        this.objCommonService.showError('Error.Please try after some times');
        this.blnShowSpinner = false;
      }
    })
  }

  /**
  * @description : To add the new employee to the datastore (User table)
  * @returns null
  */
  addUserToDatabase(userId: any, username: any) {
    if (!this.isUpdateUser) {
      const body =
      {
        "item": {
          "Email": this.objEmployeeForm.controls['email'].value,
          "Role": this.objEmployeeForm.controls['role'].value == 1 ? 2 : 3,
          "Status": 1,
          "Username": username,
          "User_id": userId,
          "Manager_Id": this.intManagerId ? this.intManagerId : null,
          "Group_id": this.objEmployeeForm.controls['role'].value == 1 ? this.intParentGroupId : this.intChildGroupId
        },
        "access_key_updates": {
          "ignore_action_settings": true,
          "roles_to_publish": ["USER", "MANAGER", "ADMIN"]
        }
      }
      this.objUserService.addUserToDatabase(body).pipe(takeUntil(this.objDestroyed$)).subscribe({
        next: () => {
          this.blnShowSpinner = false;
          this.openCloseModal(1);
        },
        error: () => {
          this.objCommonService.showError('Error.Please try after some times');
          this.blnShowSpinner = false;
          if (this.objEmployeeForm.controls['role'].value == 1) {
            this.deleteGroup(this.intParentGroupId);
          } else if (this.objEmployeeForm.controls['role'].value == 2) {
            this.deleteUser(userId, this.intChildGroupId);
          }
        }
      })
    }
    else {
      this.updateUserInDatabase(userId, username)
    }
  }

  /**
  * @description : To update the employee record with new details to the datastore (User table)
  * @returns null
  */
  updateUserInDatabase(userId: any, username: any) {
    const paramsUser = {
      "item": {
        "Role": this.objEmployeeForm.controls['role'].value == 1 ? 2 : 3,
        "Status": 1,
        "Username": username,
        "Manager_Id": this.intManagerId ? this.intManagerId : null,
        "Group_id": this.objEmployeeForm.controls['role'].value == 1 ? this.intParentGroupId : this.intChildGroupId
      },
      "use_display_id": true,
      "is_force_update": true
    }
    this.objUserService.updateUser(paramsUser, this.userItemId).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: () => {
        this.blnShowSpinner = false;
        this.openCloseModal(1);
      }, error: () => {
        this.objCommonService.showError('Error.Please try after some times');
        this.blnShowSpinner = false;
        if (this.objEmployeeForm.controls['role'].value == 1) {
          this.deleteGroup(this.intParentGroupId);
        } else if (this.objEmployeeForm.controls['role'].value == 2) {
          this.deleteUser(userId, this.intChildGroupId);
        }
      }
    })
  }

  /**
  * @description : To remove an employee from the workspace and group
  * @returns null
  */
  deleteUser(userId: any, groupId: any) {
    const body = {
      "g_id": groupId,
      "u_id": userId,
      "w_id": this.workspace_id
    }
    this.objUserService.removeUserFromWorkspace(body).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: () => { },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times');
        this.blnShowSpinner = false;
      }
    })
  }

  /**
  * @description : To create a group if the new employee is in 'Manager' role
  * @returns null
  */
  createParentGroup() {
    const body = {
      "name": this.objEmployeeForm.controls['groupName'].value,
      "display_id": this.objEmployeeForm.controls['groupName'].value
    }
    this.objUserService.createParentGroup(body).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.intParentGroupId = objResponse.group.id;
        this.createChildGroup(objResponse.group.id);
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times');
        this.blnShowSpinner = false;
      }
    })
  }

  /**
  * @description : To create a child group for the top group of an employee in 'Manager' role
  * @returns null
  */
  createChildGroup(groupId: any) {
    const body = {
      "name": this.objEmployeeForm.controls['groupName'].value + "_members",
      "display_id": this.objEmployeeForm.controls['groupName'].value + "_members"
    }
    this.objUserService.createChildGroup(groupId, body).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.intChildGroupId = objResponse.group.id;
        this.addUserToWorkspace();
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times');
        this.blnShowSpinner = false;
        this.deleteGroup(groupId);
      }
    })
  }

  /**
   * @description : To delete a group from the group tree of the workspace
   * @returns null
   */
  deleteGroup(groupId: any) {
    const body = {
      "id": this.intParentGroupId
    }
    this.objUserService.deleteGroup(body).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.intParentGroupId = objResponse.group.id;
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times');
        this.blnShowSpinner = false;
      }
    })
  }

  /**
   * @description : To register a new employee according to the selected role
   * @returns null
   */
  register() {
    if (this.objEmployeeForm.controls['role'].value === 2 && this.intParentGroupId && this.intChildGroupId) {
      this.addUserToWorkspace();
    } else if (this.objEmployeeForm.controls['role'].value === 1) {
      this.createParentGroup();
    }
    else {
      this.blnShowSpinner = false;
    }
  }

  /**
  * @description : To check if the employee details is already registered in the User datastore
  * @returns null
  */
  checkUser() {
    this.blnShowSpinner = true;
    const params = {
      "conditions": [
        {
          "id": "Email", "search_value": [this.objEmployeeForm.controls['email'].value], "exact_match": true
        }
      ],
      "use_or_condition": false,
      "page": this.intPageNumber,
      "per_page": this.initPageSize,
      "use_display_id": true,
      "return_number_value": true,
    }
    this.objUserService.listAllUsers(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        if (objResponse?.totalItems != 0) {
          if (objResponse.items[0].Status == 1) {
            this.objCommonService.showError('User with this Email already exist');
            this.blnShowSpinner = false;
          }
          else {
            this.isUpdateUser = true;
            this.userItemId = objResponse.items[0].i_id;
            this.register();
          }

        } else {
          this.isUpdateUser = false;
          this.register();
        }
      },
      error: () => {
        this.objCommonService.showError('Error');
        this.blnShowSpinner = false;
      }
    })
  }
}
