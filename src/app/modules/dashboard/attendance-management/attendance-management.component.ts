import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AttendanceService } from 'src/app/core/services/attendance.service';
import { AttendanceModalComponent } from './attendance-modal/attendance-modal.component';
import { ConfirmModalComponent } from 'src/app/shared/components/confirm-modal/confirm-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/core/services/common.service';
import * as moment from 'moment';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-attendance-management',
  templateUrl: './attendance-management.component.html',
  styleUrls: ['./attendance-management.component.css']
})
export class AttendanceManagementComponent {

  private objDestroyed$ = new Subject();
  isReset: boolean = true;
  intUserRole !: number;
  intUserId !: any;
  intUserGroupId !: any;
  intPageNumber: number = 1;
  initPageSize: number = 10;
  aryAttendanceList: any = [];
  modelDate: any = '';
  objModalList: any = AttendanceModalComponent;
  objConfirmModalList: any = ConfirmModalComponent;
  boolIsLoading: any = true;
  aryUserList: any = [];
  aryAllUsers: any = [];
  aryDropdownUserList: any = [];
  intTotalItems: number = 0;
  strDateSort: any = "asc";
  strTimeinSort: any = "asc";
  strYearPlaceholder = "All";
  aryStatus: string[] = [];
  boolUserStatus: boolean = false;
  attendanceSearchForm: FormGroup = this.fb.group({
    userStatus :  this.fb.control("1"),
    employeeName: this.fb.control("0"),
    yearMonth: this.fb.control(""),
    status: this.fb.control("3"),
  });


  constructor(
    private objAttendanceService: AttendanceService,
    private objUserService: UserService,
    private objCommonService: CommonService,
    private objModalService: NgbModal,
    private fb: FormBuilder
  ) { }

  /**
   * @description : Destroy the subcriptions
   * @returns null
   */
  ngOnDestroy() {
    this.objDestroyed$.next(void 0);
    this.objDestroyed$.complete();
  }

  ngOnInit(): void {
    this.aryStatus = ["0", "1", "2"];
    this.getUserDetails();
  }

  /**
   * @description : Get the details of the logged-in user
   * @returns null
   */
  getUserDetails() {
    this.boolIsLoading = true;
    this.objCommonService.getUserDetais.pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        if (objResponse) {
          this.intUserRole = objResponse.role;
          this.intUserId = objResponse.userId;
          this.intUserGroupId = objResponse.groupId
          if (this.intUserRole && this.intUserGroupId && this.intUserRole != 3) {
            this.getAllUsersList();
            this.getAllUsersInUserTable();
          }else if(this.intUserRole && this.intUserRole === 3){
            this.searchAllAttendanceDetails();
          }
        }
      },
      error: () => {
        this.boolIsLoading = false;
        this.objCommonService.showError('Error,please try after some times')
      }
    })
  }

  /**
   * @description : Default search condition for displaying attendence list
   * @returns null
   */
  searchAllAttendanceDetails() {
    let params: any;
    if (this.intUserRole == 3) {
      params = {
        "conditions": [
          { "id": "Emp_id", "search_value": [this.intUserId], "exact_match": true },
          { "id": "Status", "search_value": this.aryStatus, "exact_match": true }
        ],
        "use_or_condition": false,
        "sort_fields": [
          { "id": "Date", "order": this.strDateSort },
          { "id": "Time_in", "order": this.strTimeinSort }
        ],
        "page": this.intPageNumber,
        "per_page": this.initPageSize,
        "use_display_id": true,
        "return_number_value": true
      }
    }
    else {
      params = {
        "conditions": [
          { "id": "Status", "search_value": this.aryStatus, "exact_match": true },
          { "id": "Emp_id", "search_value": this.aryAllUsers, "exact_match": true },
        ],
        "use_or_condition": false,
        "sort_fields": [
          { "id": "Date", "order": this.strDateSort },
          { "id": "Time_in", "order": this.strTimeinSort }
        ],
        "page": this.intPageNumber,
        "per_page": this.initPageSize,
        "use_display_id": true,
        "return_number_value": true
      }
    }

    this.getAttendanceDetails(params);
  }

  /**
   * @description : Get list of data from attendance table based on conditions specified in params
   * @param params : params for listing attendance on condition
   * @returns null
   */
  getAttendanceDetails(params: any) {
    this.boolIsLoading = true;
    this.objAttendanceService.listAttendance(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.aryAttendanceList = objResponse.items;
        this.intTotalItems = objResponse.totalItems;
        if (this.intPageNumber > 1 && this.aryAttendanceList.length === 0) {
          this.intPageNumber = this.intPageNumber - 1;
          this.searchAllAttendanceDetails();
        }
        this.boolIsLoading = false;
        this.isReset = false;
      },
      error: () => {
        this.boolIsLoading = false;
        this.isReset = false;
        this.objCommonService.showError('Failed to load data')
      }
    })
  }


  /**
   * @description : To delete a particular entry from the attendence list
   * @param id : params for deleting an entry from the attendance list
   * @returns null
   */
  deleteAttendance(id: any) {

    this.objAttendanceService.deleteAttendance(id).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.objCommonService.showSuccess('Attendance deleted successfully');
        this.searchAttendance();
      },
      error: () => {
        this.objCommonService.showError('Error.Cannot delete attendace')
      }
    })
  }
  /**
   * @description : Open confirm modal when click delete button in attendence table
   * @param id : params for deleting an entry from the attendance list
   * @returns null
   */
  clickDelete(itemId?: any, modalSize?: string) {
    const modalRef = this.objModalService.open(this.objConfirmModalList, { size: modalSize || 'md', centered: true });
    modalRef.componentInstance.strMessage = "Are you sure you want to delete the Attendance?";
    modalRef.result.then((result) => {
      // On modal close, check the returned result
      // if result is 1, call detele function
      if (result === 1) {
        this.deleteAttendance(itemId);
      }
    },);
  }

  /**
   * @description : To open a modal for adding a new attendence or editing an existing attendence 
   * @param modalId : param for identifying modal whether to add or edit
   * @param itemId : param for identifying the particular entry for edit 
   * @param modalSize: param for setting the size of the modal
   * @returns objResponse : response from hexabase attendance API
   */
  openModal(modalId: number, itemId?: string, modalSize?: string) {
    const modalRef = this.objModalService.open(this.objModalList, { size: modalSize || 'lg', centered: true });
    modalRef.componentInstance.intModalId = modalId;
    modalRef.componentInstance.userList = this.aryUserList;
    if (modalId === 2) {
      modalRef.componentInstance.intItemId = itemId;
    }
    modalRef.result.then((result) => {
      if (result === 1) {
        this.objCommonService.showSuccess('Attendance added successfully');
        this.searchReset();
      } else if (result === 2) {
        this.objCommonService.showSuccess('Attendance updated successfully');
        if (this.attendanceSearchForm.controls['yearMonth'].value || this.attendanceSearchForm.controls['employeeName'].value) {
          this.searchAttendance();
        }
        else {
          this.searchAllAttendanceDetails();
        }
      }
    }, (reason) => { });
  }

  /**
   * @description : Search condition for displaying attendence list specifying employee name, year and month
   * @returns null
   */
  searchAttendance() {
    let params: any;
    let condition;
    if (this.intUserRole) {
      if (this.attendanceSearchForm.controls['yearMonth'].value && this.attendanceSearchForm.controls['employeeName'].value) {
        let yearAndMonth = moment(this.attendanceSearchForm.controls['yearMonth'].value).format("YYYY-MM").split('-');
        let lastDay = yearAndMonth[0] + "-" + yearAndMonth[1] + "-" + this.daysInMonth(yearAndMonth[1], yearAndMonth[0]) + "T23:59:59Z";
        let firstDay = yearAndMonth[0] + "-" + yearAndMonth[1] + "-01T00:00:00Z";
        if (this.attendanceSearchForm.controls['employeeName'].value == 0) {
          if (this.intUserRole == 3) {
            condition = 
               [
                { "id": "Emp_id", "search_value": [this.intUserId], "exact_match": true },
                { "id": "Date", "search_value": [firstDay, lastDay], "exact_match": false },
                { "id": "Status", "search_value": this.aryStatus, "exact_match": true }
              ];
          }
          else {
            condition =  [
                { "id": "Date", "search_value": [firstDay, lastDay], "exact_match": false },
                { "id": "Status", "search_value": this.aryStatus, "exact_match": true },
                { "id": "Emp_id", "search_value": this.aryAllUsers, "exact_match": true },
              ];
          }
        }
        else {
          condition =  [
              { "id": "Date", "search_value": [firstDay, lastDay], "exact_match": false },
              { "id": "Emp_id", "search_value": [this.attendanceSearchForm.controls['employeeName'].value], "exact_match": true },
              { "id": "Status", "search_value": this.aryStatus, "exact_match": true }
            ]
        }
      }
      else if (!(this.attendanceSearchForm.controls['yearMonth'].value) && this.attendanceSearchForm.controls['employeeName'].value) {
        if (this.attendanceSearchForm.controls['employeeName'].value == 0) {
          if (this.intUserRole == 3) {
            condition =  [
                { "id": "Emp_id", "search_value": [this.intUserId], "exact_match": true },
                { "id": "Status", "search_value": this.aryStatus, "exact_match": true }
              ]
          }
          else {
            condition =  [
                { "id": "Status", "search_value": this.aryStatus, "exact_match": true },
                { "id": "Emp_id", "search_value": this.aryAllUsers, "exact_match": true },
              ];
          }
        }
        else {
          condition = [
              { "id": "Emp_id", "search_value": [this.attendanceSearchForm.controls['employeeName'].value], "exact_match": true },
              { "id": "Status", "search_value": this.aryStatus, "exact_match": true }
            ];
        }
      }
      else if (this.attendanceSearchForm.controls['yearMonth'].value && !(this.attendanceSearchForm.controls['employeeName'].value)) {
        let yearAndMonth = moment(this.attendanceSearchForm.controls['yearMonth'].value).format("YYYY-MM").split('-');
        let lastDay = yearAndMonth[0] + "-" + yearAndMonth[1] + "-" + this.daysInMonth(yearAndMonth[1], yearAndMonth[0]) + "T23:59:59Z";
        let firstDay = yearAndMonth[0] + "-" + yearAndMonth[1] + "-01T00:00:00Z";
        if (this.intUserRole == 3) {
          condition = [
              { "id": "Emp_id", "search_value": [this.intUserId], "exact_match": true },
              { "id": "Date", "search_value": [firstDay, lastDay], "exact_match": true },
              { "id": "Status", "search_value": this.aryStatus, "exact_match": true }
            ];
        }
        else {
          condition = [
              { "id": "Date", "search_value": [firstDay, lastDay], "exact_match": true },
              { "id": "Status", "search_value": this.aryStatus, "exact_match": true },
              { "id": "Emp_id", "search_value": this.aryAllUsers, "exact_match": true },
            ];
        }
      }
      else {
        if (this.intUserRole == 3) {
          condition =  [
              { "id": "Emp_id", "search_value": [this.intUserId], "exact_match": true },
              { "id": "Status", "search_value": this.aryStatus, "exact_match": true }
            ];
        }
        else {
          condition =  [
              { "id": "Status", "search_value": this.aryStatus, "exact_match": true },
              { "id": "Emp_id", "search_value": this.aryAllUsers, "exact_match": true },
            ];
        }

      }
      params = {
        "conditions": condition,
        "use_or_condition": false,
        "sort_fields": [
          { "id": "Date", "order": this.strDateSort },
          { "id": "Time_in", "order": this.strTimeinSort }
        ],
        "page": this.intPageNumber,
        "per_page": this.initPageSize,
        "use_display_id": true,
        "return_number_value": true
      }
      this.getAttendanceDetails(params);
    }
  }

  /**
   * @description : Get list of data from user table to display on the employee name dropdown
   * @returns null
   */
  getAllUsersInUserTable() {
    let params;
    if(this.intUserRole == 1){
      params = {
        "use_or_condition": false,
        "page": this.intPageNumber,
        "per_page": 0,
        "use_display_id": true,
        "return_number_value": true,
        "conditions":[
          {
             "id":"Status",
             "search_value":!this.boolUserStatus? ["1"] : ["0"],
             "exact_match": true
          },
       ],
      }
    }else if(this.intUserRole == 2){
      params = {
        "use_or_condition": false,
        "page": this.intPageNumber,
        "per_page": 0,
        "use_display_id": true,
        "return_number_value": true,
        "conditions":[
          {
             "id":"Manager_Id",
             "search_value":[this.intUserId],
          },
          {
            "id":"Status",
            "search_value":["1"],
            "exact_match": true
         },
       ],
      }
    }
    
    this.objUserService.listAllUsers(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.aryDropdownUserList = objResponse.items;
        this.aryAllUsers = this.aryDropdownUserList.map((items:any) => {
          return items.User_id;
      })     
        if(this.intUserRole == 2){          
          this.getLoggedManagerDeatilsInUserTable();
        }else{
          this.searchAllAttendanceDetails();
        }
      },
        error: () => {
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
  }
  getLoggedManagerDeatilsInUserTable() {
      let params = {
        "use_or_condition": false,
        "page": this.intPageNumber,
        "per_page": 0,
        "use_display_id": true,
        "return_number_value": true,
        "conditions":[
          {
             "id":"User_id",
             "search_value":[this.intUserId],
          },
       ],
      }    
    this.objUserService.listAllUsers(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.aryDropdownUserList = this.aryDropdownUserList.concat(objResponse.items);  
        this.aryAllUsers = this.aryAllUsers.concat(objResponse.items[0].User_id);
        setTimeout(() => {  this.searchAllAttendanceDetails(); }, 200);
      },
        error: () => {
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
  }
  getAllUsersList() {
    if (this.intUserRole == 2) {
      this.getParantGroupUsers();
    } else if (this.intUserRole == 1) {
      this.getManagerRoleUsers();
    }

  }
  getParantGroupUsers() {
    this.objUserService.listAllUsersByGroupId(this.intUserGroupId).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.aryUserList = objResponse.members;
        this.getChildGroupId();
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
  }
  getChildGroupId() {
    this.objUserService.listAllGroupsByGroupId(this.intUserGroupId).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.getChildGroupUsers(objResponse.children[0].g_id);
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
  }
  getChildGroupUsers(childGroupId: any) {
    this.objUserService.listAllUsersByGroupId(childGroupId).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.aryUserList = this.aryUserList.concat(objResponse.members);
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
  }
  getManagerRoleUsers() {
    this.objUserService.listAllManagerRoles().pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.aryUserList = objResponse.role_users;
        this.getUserRoleUsers();
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
  }
  getUserRoleUsers() {
    this.objUserService.listAllUserRoles().pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.aryUserList = this.aryUserList.concat(objResponse.role_users);
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
  }
  /**
   * @description : To display the calender view to select year and month
   * @returns null
   */
  onOpenCalendar(container: any) {
    container.monthSelectHandler = (event: any): void => {
      container._store.dispatch(container._actions.select(event.date));
    };
    container.setViewMode('month');
  }

  /**
   * @description : To calculate number of days in a month, specifying the month and year
   * @param month : param for identifying month
   * @param year : param for identifying year
   * @returns date : response as the last date of the month
   */
  daysInMonth(month: any, year: any) {
    return new Date(year, month, 0).getDate();
  }

  /**
   * @description : To clear the filter conditions of the attendence list
   * @returns null
   */
  searchReset() {
    this.isReset = true;
    this.attendanceSearchForm.controls['employeeName'].setValue('0');
    this.attendanceSearchForm.controls['yearMonth'].setValue('');
    this.attendanceSearchForm.controls['status'].setValue('3');
    this.aryStatus = ["0", "1", "2"];
    this.intPageNumber = 1;
    this.aryAttendanceList = [];
    setTimeout(() => {
      this.searchAllAttendanceDetails();
    }, 200);

  }

  /**
   * @description : To prevent the manual typing in the year-month view
   * @returns null
   */
  preventTyping(event: any) {
    event.preventDefault();
  }

  /**
   * @description : To change the list content upon page change event
   * @param event : to identify whether it is next page or prev page
   * @returns null
   */
  onTableDataChange(event: any) {
    if (this.attendanceSearchForm.controls['yearMonth'].value || this.attendanceSearchForm.controls['employeeName'].value) {
      this.searchAttendance();
    }
    else {
      this.searchAllAttendanceDetails();
    }

  }

  onFilterChange() {
    if (!this.isReset) {
      this.intPageNumber = 1;
      if (this.attendanceSearchForm.controls['status'].value) {
        switch (this.attendanceSearchForm.controls['status'].value) {
          case "3":
            this.aryStatus = ["0", "1", "2"];
            break;
          case "0":
            this.aryStatus = ["0"];
            break;
          case "1":
            this.aryStatus = ["1"];
            break;
          case "2":
            this.aryStatus = ["2"];
            break;
          default:
            this.aryStatus = ["0", "1", "2"];
            break;
        }
      }
      this.searchAttendance();
    }
  }

  dateSortChange(event: any) {
    this.strDateSort = (event == 'asc') ? "asc" : "desc";
    if (this.attendanceSearchForm.controls['yearMonth'].value || this.attendanceSearchForm.controls['employeeName'].value) {
      this.searchAttendance();
    }
    else {
      this.searchAllAttendanceDetails();
    }
  }
  changesStatus(status: any, itemId: any) {
    let params = {
      "item": {
        "Status": status,
      },
      "use_display_id": true,
      "is_force_update": true,
      "return_item_result": true
    }
    this.objAttendanceService.editAttendance(params, itemId).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.objCommonService.showSuccess('Attendance status updated successfully');
        this.searchAttendance();
      },
      error: () => {
        this.objCommonService.showError('Error.Cannot update attendace status')
      }
    })
  }
  changeUserStatus(event:any){
  this.boolUserStatus = event.target.value == "0" ? true : false;
  console.log(event.target.value)
  this.intPageNumber = 1;
  this.isReset = true;
  this.attendanceSearchForm.controls['employeeName'].setValue('0');
  this.attendanceSearchForm.controls['yearMonth'].setValue('');
  this.attendanceSearchForm.controls['status'].setValue('3');
  this.aryStatus = ["0", "1", "2"];
  this.intPageNumber = 1;
  this.aryAttendanceList = [];
  this.getUserDetails();
  }
}
