import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AttendanceService } from 'src/app/core/services/attendance.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/core/services/common.service';
import { UserService } from 'src/app/core/services/user.service';
import { EmployeeModalComponent } from './employee-modal/employee-modal.component';
import { EmployeeEditModalComponent } from './employee-edit-modal/employee-edit-modal.component';
import { ConfirmModalComponent } from 'src/app/shared/components/confirm-modal/confirm-modal.component';
import { environment } from 'src/environments/environment';
import { UpdateManagerComponent } from './update-manager/update-manager.component';

@Component({
  selector: 'app-employee-management',
  templateUrl: './employee-management.component.html',
  styleUrls: ['./employee-management.component.css'],
})
export class EmployeeManagementComponent implements OnInit, OnDestroy {

  private objDestroyed$ = new Subject();
  private workspace_id = environment.workspace_id;
  aryUserList: any = [];
  intPageNumber: number = 1;
  initPageSize: number = 10;
  intUserRole !: number;
  intUserId !: any;
  intUserGroupId !: any;
  boolIsLoading: any = true;
  employeeGrpName: any;
  objModalList: any = {
    0: EmployeeModalComponent,
    1: EmployeeEditModalComponent,
    2: UpdateManagerComponent
  }
  objConfirmModalList: any = ConfirmModalComponent;

  totalItems: number = 0;
  aryRoles: string[] = [];
  employeeSearchForm: FormGroup = this.objFormBuilder.group({
    employeeName: this.objFormBuilder.control(""),
    role: this.objFormBuilder.control("0"),
  });
  constructor(
    private objAttendanceService: AttendanceService,
    private objUserService: UserService,
    private objCommonService: CommonService,
    private objModalService: NgbModal,
    private objFormBuilder: FormBuilder
  ) { }


  ngOnDestroy() {
    this.objDestroyed$.next(void 0);
    this.objDestroyed$.complete();
  }
  ngOnInit(): void {
    this.aryRoles = ["1", "2", "3"];
    this.getAllUsers();
    this.getLoggedUserDetails();
  }

  identifyUser(index: any, i: any) {
    return i.Username;
  }

  /**
   * @description : To get the details of the logged-in user
   * @returns null
   */
  getLoggedUserDetails() {
    this.objCommonService.getUserDetais.pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        if (objResponse) {
          this.intUserId = objResponse.userId;
          this.intUserRole = objResponse.role;
          this.getAllUsers();
        }
      }, error: () => {
        this.objCommonService.showError('Error,please try after some times')
      }
    })
  }

  /**
   * @description : To catch the page change event of the employee list 
   * @returns null
   */
  pageChange(event: any) {
    this.intPageNumber = event;
    this.getAllUsers();
  }

  /**
   * @description : To catch the value change of 'role' filter the employee list 
   * @returns null
   */
  onFilterChange() {
    this.intPageNumber = 1;
    if (this.employeeSearchForm.controls['role'].value) {
      switch (this.employeeSearchForm.controls['role'].value) {
        case "0":
          this.aryRoles = ["1", "2", "3"];
          break;
        case "1":
          this.aryRoles = ["1"];
          break;
        case "2":
          this.aryRoles = ["2"];
          break;
        case "3":
          this.aryRoles = ["3"];
          break;
        default:
          this.aryRoles = ["1", "2", "3"];
          break;
      }
    }
    this.getAllUsers();
  }

  /**
   * @description : To reset the filter conditions of the employee list 
   * @returns null
   */
  searchReset() {
    this.employeeSearchForm.controls['employeeName'].setValue('');
    this.employeeSearchForm.controls['role'].setValue('0');
    this.aryRoles = ["1", "2", "3"];
    this.intPageNumber = 1;
    this.aryUserList = [];
    setTimeout(() => {
      this.getAllUsers();
    }, 200);
  }

  /**
   * @description : To catch search input change event to filter an employee name from the employee list 
   * @returns null
   */
  searchUsers() {
    this.intPageNumber = 1;
    this.getAllUsers();
  }

  /**
   * @description : To get the employee list with a like search match of employee name
   * @returns null
   */
  getAllUsers() {
    this.boolIsLoading = true;
    const params = {
      "conditions": [
        { "id": "Role", "search_value": this.aryRoles, "exact_match": true },
        this.employeeSearchForm.controls['employeeName'].value ?
          { "id": "Username", "search_value": ["(?i)("+this.employeeSearchForm.controls['employeeName'].value+")"], "exact_match": false } : null
      ],
      "use_or_condition": false,
      "page": this.intPageNumber,
      "per_page": this.initPageSize,
      "use_display_id": true,
      "return_number_value": true
    }
    this.getEmployeeList(params, false)
  }

  /**
   * @description : To get the employee list with exact search match of employee name
   * @returns null
   */
  getAllUsersWithSearchExactMatch() {
    this.boolIsLoading = true;
    const params = {
      "conditions": [
        { "id": "Role", "search_value": this.aryRoles, "exact_match": true },
        this.employeeSearchForm.controls['employeeName'].value ?
          { "id": "Username", "search_value": [this.employeeSearchForm.controls['employeeName'].value], "exact_match": true } : null
      ],
      "use_or_condition": false,
      "page": this.intPageNumber,
      "per_page": this.initPageSize,
      "use_display_id": true,
      "return_number_value": true
    }
    this.getEmployeeList(params, true)
  }

  /**
  * @description : API call to get the employee list with search conditions
  * @param params: param to pass the search conditions
  * @param exactMatch: param to identify whether the employee name search is exact match or not
  * @returns null
  */
  getEmployeeList(params: any, exactMatch: boolean) {
    this.objUserService.listAllUsers(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        if (this.employeeSearchForm.controls['employeeName'].value && objResponse.items.length === 0 && !exactMatch) {
          this.getAllUsersWithSearchExactMatch();
        } else {
          this.aryUserList = objResponse.items;
          this.totalItems = objResponse.totalItems;
          this.boolIsLoading = false;
        }
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times');
        this.boolIsLoading = false;
      }
    })
  }
  /**
   * @description Function to open ngbModal.
   * @param modalId Id to say which modal to be opened add or edit -> refers to vaiable objModalLiist
   * @param modalSize Optional parameter to say modal size, default will be 'lg'
   */
  openModal(modalId: number, item?: any, strModalSize?: string) {
    const modalRef = this.objModalService.open(this.objModalList[modalId], { size: strModalSize || 'lg', centered: true });
    if (modalId == 1) {
      modalRef.componentInstance.selfUpdate = false;
      modalRef.componentInstance.userId = item.User_id;
      modalRef.componentInstance.userrole = item.Role;
    }
    modalRef.result.then((result) => {
      if (result === 1) {
        this.objCommonService.showSuccess('User registered successfully');
        this.searchReset();
      }
      else if (result === 3) {
        this.objCommonService.showSuccess('User Updated successfully');
        this.getAllUsers();
      }
    }, (reason) => { });
  }

  /**
   * @description Function to open ngbModal for delete.
   * @param itemId Id to say which item to be deleted
   * @param modalSize Optional parameter to say modal size, default will be 'lg'
   */
  openDeleteModal(item?: any, modalSize?: string) {
    const modalRef = this.objModalService.open(this.objConfirmModalList, { size: modalSize || 'md', centered: true });
    modalRef.componentInstance.strMessage = "Are you sure you want to delete the employee?";
    modalRef.result.then((result) => {
      // On modal close, check the returned result
      // if result is 1, call detele function
      if (result === 1) {
        if (item.Role === 3) {
          this.deleteEmployeeFromWorkspace(item);
        }
        else {
          this.findGeneralUsers(item);
        }
      }
    },);
  }

  /**
   * @description : To delete a particular entry from the employee list
   * @param item : params for deleting an entry from the workspace first
   * @returns null
   */
  deleteEmployeeFromWorkspace(item: any) {
    const params = {
      "u_id": item.User_id,
      "g_id": item.Group_id,
      "w_id": this.workspace_id
    }
    this.objUserService.removeUserFromWorkspace(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: () => {
        this.updateInactiveStatusInDatastore(item);
      },
      error: () => {
        this.objCommonService.showError('Error in deleting employee. Please try again.')
      }
    })
  }

  /**
   * @description : To delete a particular entry from the employee list with status 0
   * @param item : params for updating an entry in the datastore, user table
   * @returns null
   */
  updateInactiveStatusInDatastore(item: any) {
    const paramsUser = {
      "item": {
        "Status": 0
      },
      "use_display_id": true,
      "is_force_update": true
    }
    this.objUserService.updateUser(paramsUser, item.i_id).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: () => {
        this.objCommonService.showSuccess('Employee Deleted successfully');
        this.searchReset();
      }, error: () => {
        this.objCommonService.showError('Error in deleting employee from datastore.Please try after some times')
        if (item.Role == 2) {
          this.createParentGroup(item);
        }
        else {
          this.addUserToWorkspace(item, null, item.Group_id)
        }
      }
    })
  }

  /**
   * @description : To update a particular entry from the employee list with status 1
   * @param item : params for updating an entry in the datastore, user table
   * @returns null
   */
  updateActiveStatusInDatastore(item: any, groupId?:any) {
    const paramsUser = {
      "item": {
        "Status": 1,
        "Group_id" : (item.Role == 2)? groupId : item.Group_id
      },
      "use_display_id": true,
      "is_force_update": true
    }
    this.objUserService.updateUser(paramsUser, item.i_id).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: () => {
        this.searchReset();
      }, error: () => {
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
  }

  /**
   * @description : To delete the entries of the deleted employee from the Attendance table
   * @param userId: param that indicates the user_id of deleted employee
   * @returns null
   */
  deleteUserAttendance(userId: any) {
    const params = {
      "conditions": [
        { "id": "Emp_id", "search_value": [userId] }
      ],
      "use_display_id": true
    }
    this.objAttendanceService.bulkDeleteAttendance(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: () => { },
      error: () => {
        this.objCommonService.showError('Error bulk delete.Please try after some times')
      }
    })
  }

  /**
  * @description : To find if there are any child group under a manager
  * @param item : params for retrieving the child group details under the manager
  * @returns null
  */
  findGeneralUsers(item: any) {
    this.objUserService.listAllGroupsByGroupId(item.Group_id).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.employeeGrpName = objResponse.group.name;
        if (objResponse.children.length > 0) {
          this.getChildGroupUsers(item, objResponse.children[0].g_id);
        }
        else {
          this.deleteManagerGroup(item);
        }
      },
      error: () => {
        this.objCommonService.showError('Error finding general users under the manager. Please try after some times')
      }
    })
  }

  /**
 * @description : To delete the manager's group
 * @param item : params for deleteing the top group where manager is added
 * @returns null
 */
  deleteManagerGroup(item: any) {
    const body = {
      "id": item.Group_id
    }
    this.objUserService.deleteGroup(body).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: () => {
        this.removeUserRole(item);
      },
      error: () => {
        this.objCommonService.showError('Error deleting the manager group.Please try after some times');
      }
    })
  }

  /**
  * @description : To find if there are any users added under a manager
  * @param item : details of the selected manager
  * @param childGroup_id: id for retrieving the child group and users in that child group under the manager
  * @returns null
  */
  getChildGroupUsers(item: any, childGroup_id: string) {
    const params = {
      "conditions": [
        { "id": "Role", "search_value": ["3"], "exact_match": true },
        { "id": "Group_id", "search_value": [childGroup_id], "exact_match": true },
        { "id": "Status", "search_value": ["1"], "exact_match": true }
      ],
      "use_or_condition": false,
      "page": 1,
      "per_page": 10,
      "use_display_id": true,
      "return_number_value": true
    }
    this.objUserService.listAllUsers(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        if (objResponse.totalItems == 0) {
          this.deleteManagerGroup(item);
        }
        else {
          this.objCommonService.showError('Cannot delete the employee! Move all the general users under this manager using "Change Manager" first')
        }
      },
      error: () => {
        this.objCommonService.showError('Error finding general users under the manager.Please try after some times')
      }
    })
  }

  /**
   * @description : To remove the role from the employee
   * @param item : params with details of the employee
   * @returns null
   */
  removeUserRole(item: any) {
    let role: any;
    switch (item.Role) {
      case 1:
        role = "ADMIN";
        break;
      case 2:
        role = "MANAGER";
        break;
      case 3:
        role = "USER";
        break;

      default:
        break;
    }

    const body = {
      "user_id": item.User_id,
      "role_id": role
    }
    this.objUserService.removeRoleToUser(body).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: () => {
        this.updateInactiveStatusInDatastore(item);
      },
      error: () => {
        this.objCommonService.showError('Error removing employee role.Please try after some times');
        this.createParentGroup(item);
      }
    })
  }

  /**
   * @description : To assign role to the new employee 
   * @returns null
   */
  addRoleToUser(employee: any, userId: any, role: any, group_id?:any,) {
    const body = {
      "user_id": userId,
      "role_id": role
    }
    this.objUserService.addRoleToUser(body).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: () => {
        this.updateActiveStatusInDatastore(employee,group_id);
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times');
      }
    })
  }

  /**
  * @description : To create a group if the new employee is in 'Manager' role
  * @returns null
  */
  createParentGroup(employee: any) {
    const body = {
      "name": this.employeeGrpName,
      "display_id": this.employeeGrpName
    }
    this.objUserService.createParentGroup(body).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.createChildGroup(objResponse.group.id, employee);
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times');
      }
    })
  }

  /**
  * @description : To create a child group for the top group of an employee in 'Manager' role
  * @returns null
  */
  createChildGroup(topGroupId: any, employee: any) {
    const body = {
      "name": this.employeeGrpName + "_members",
      "display_id": this.employeeGrpName + "_members"
    }
    this.objUserService.createChildGroup(topGroupId, body).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.addUserToWorkspace(employee, topGroupId, objResponse.group.id);
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times');
      }
    })
  }

  /**
   * @description : To add the new employee to the workspace and group
   * @returns null
   */
  addUserToWorkspace(employee: any, topGroupId?: any, childGroupId?: any) {
    const body = {
      "email": employee.Email,
      "g_id": employee.Role == 2 ? topGroupId : childGroupId,
      "w_id": this.workspace_id
    }
    this.objUserService.addUserToWorkspace(body).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.addRoleToUser(employee, objResponse.user_profile.u_id, employee.Role == 2 ? "MANAGER" : "USER", topGroupId)
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times');
      }
    })
  }
}
