import { Component, Injectable, Input } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbActiveModal, NgbDateAdapter, NgbDateParserFormatter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/core/services/common.service';
import { AttendanceService } from 'src/app/core/services/attendance.service';
import * as moment from 'moment';
import { UserService } from 'src/app/core/services/user.service';
import { toNgbDateStruct } from 'src/app/shared/functions/datepicker.functions';
import { AppConstants } from 'src/app/core/constants/common.constants';
import { DeviceDetectorService } from 'ngx-device-detector';

@Injectable()
export class CustomDateAdapter {
  fromModel(value: string): any {
    if (!value)
      return null
    let parts = value.split('/');
    return { year: +parts[2], month: +parts[1], day: +parts[0] } as NgbDateStruct
  }

  toModel(date: NgbDateStruct): any {
    return date ? ('0' + date.day).slice(-2) + "/" + ('0' + date.month).slice(-2) + "/" + date.year : null
  }

}
@Injectable()
export class CustomDateParserFormatter {
  parse(value: string): any {
    if (!value)
      return null
    let parts = value.split('/');
    return { year: +parts[2], month: +parts[1], day: +parts[0] } as NgbDateStruct

  }
  format(date: NgbDateStruct): any {
    return date ? ('0' + date.day).slice(-2) + "/" + ('0' + date.month).slice(-2) + "/" + date.year : null
  }
}

@Component({
  selector: 'app-attendance-modal',
  templateUrl: './attendance-modal.component.html',
  styleUrls: ['./attendance-modal.component.css'],
  providers: [{ provide: NgbDateAdapter, useClass: CustomDateAdapter }, { provide: NgbDateParserFormatter, useClass: CustomDateParserFormatter }]
})

export class AttendanceModalComponent {
  @Input() intModalId!: number;
  @Input() intItemId!: number;
  @Input() userList!: any;

  private objDestroyed$ = new Subject();

  intTabIndex: number = 1;
  intUserRole !: number;
  intUserId !: number;
  intSelectedUserId !: string;
  intSelectedManagerId!: string;
  strGroupId!: string;
  strUserName !: string;
  intPageNumber: number = 1;
  initPageSize: number = 0;
  aryAdminUsers: any = [];
  aryPublishUsers: any = [];
  aryUserList: any = [];
  aryHr: any = [];
  aryMin: any = [];
  date: any = new Date();
  blnShowSpinner: boolean = false;
  blnTimeError: boolean = false;
  blnInvalidDate: boolean = false;
  blnFutureDate: boolean = false;
  blnIsValidDate: boolean = true;
  attendanceDate: any;
  browser: string ="Chrome";

  ngbMindate: NgbDateStruct = toNgbDateStruct('2000-01-01')
  ngbMaxDate: NgbDateStruct = toNgbDateStruct(moment(new Date(this.date)).format('YYYY-MM-DD'))

  objAttendanceForm = this.objFormBuilder.group({
    employeeId: this.objFormBuilder.control(0, [Validators.required]),
    employeeName: this.objFormBuilder.control('', [Validators.required]),
    date: this.objFormBuilder.control('', [Validators.required, Validators.pattern(AppConstants.REGEX_DATE)]),
    timeIn: this.objFormBuilder.control('', [Validators.required]),
    timeOut: this.objFormBuilder.control('', [Validators.required]),
    timeInHr: this.objFormBuilder.control('0', [Validators.required]),
    timeInMin: this.objFormBuilder.control('0', [Validators.required]),
    timeOutHr: this.objFormBuilder.control('0', [Validators.required]),
    timeOutMin: this.objFormBuilder.control('0', [Validators.required]),
  });
  constructor(
    private objFormBuilder: FormBuilder,
    public objActiveModal: NgbActiveModal,
    private objUserService: UserService,
    private objCommonService: CommonService,
    private objAttendanceService: AttendanceService,
    private deviceService: DeviceDetectorService
  ) { }

  ngOnDestroy() {
    this.objDestroyed$.next(void 0);
    this.objDestroyed$.complete();
  }

  ngOnInit(): void {
    this.aryUserList = this.userList;
    this.aryHr = Array.from(Array(24).keys()).map(x => x < 10 ? '0' + x : x.toString())
    this.aryMin = ["00", "15", "30", "45"];
    this.getLoggedUserId();
    if (this.intModalId === 2) {
      this.getAttendance();
    }
    if (this.intTabIndex == 1) {
      this.objAttendanceForm.controls['date'].setValue(new Date().toLocaleDateString('en-GB'));
    }
    this.getBrowserName();
    if(this.intUserRole != 3){
      this.getAdminUsers();
    }
  }
  getBrowserName() {
    this.browser = this.deviceService.browser;
  }
  timeInChange() {
    if (this.objAttendanceForm.controls["timeInHr"].value && this.objAttendanceForm.controls["timeInMin"].value &&
      this.objAttendanceForm.controls["timeInHr"].value !== "0" && this.objAttendanceForm.controls["timeInMin"].value != "0") {
      this.objAttendanceForm.controls["timeIn"].setValue(this.objAttendanceForm.controls["timeInHr"].value + ":" + this.objAttendanceForm.controls["timeInMin"].value);
      if (this.objAttendanceForm.controls["timeIn"].value && this.objAttendanceForm.controls["timeOut"].value) {
        this.timeCheck();
      }
    }
  }
  timeOutChange() {
    if (this.objAttendanceForm.controls["timeOutHr"].value && this.objAttendanceForm.controls["timeOutMin"].value &&
      this.objAttendanceForm.controls["timeOutHr"].value !== "0" && this.objAttendanceForm.controls["timeOutMin"].value !== "0") {
      this.objAttendanceForm.controls["timeOut"].setValue(this.objAttendanceForm.controls["timeOutHr"].value + ":" + this.objAttendanceForm.controls["timeOutMin"].value);
      if (this.objAttendanceForm.controls["timeIn"].value && this.objAttendanceForm.controls["timeOut"].value) {
        this.timeCheck();
      }
    }
  }
  timeCheck() {
    if (this.objAttendanceForm.controls["timeIn"].value && this.objAttendanceForm.controls["timeOut"].value) {
      if (this.objAttendanceForm.controls["timeIn"].value >= this.objAttendanceForm.controls["timeOut"].value) {
        this.blnTimeError = true;
      } else {
        this.blnTimeError = false;
      }
    }
  }
  dateCheck() {
    if (this.objAttendanceForm.controls["date"].value) {
       let selectedDate = this.convertDateFormat(this.objAttendanceForm.controls["date"].value);
       this.blnIsValidDate = this.validateDate(selectedDate.split('-')[0],selectedDate.split('-')[1],selectedDate.split('-')[2]);
      if (new Date(selectedDate) > new Date(moment(this.date).format("YYYY-MM-DD"))) {
        this.blnFutureDate = true;
        this.blnInvalidDate = false;
      } else if (new Date(selectedDate) < new Date(moment("2000-01-01").format("YYYY-MM-DD"))) {
        this.blnInvalidDate = true;
        this.blnFutureDate = false;
      }
      else {
        this.blnInvalidDate = false;
        this.blnFutureDate = false;
      }
    }else{
      this.blnIsValidDate = true;
    }
  }
  validateDate(year:any, month:any, day:any) {
    month = month - 1;
    var d = new Date(year, month, day);
    if (d.getFullYear() == year && d.getMonth() == month && d.getDate() == day) {
      return true;
    }
    return false;
}
  setEmployeeName(event: any) {
    let selectedData = this.aryUserList[this.aryUserList.map(function (item: any) { return item.u_id; }).indexOf(event.target.value)];
    this.objAttendanceForm.controls['employeeName'].setValue(selectedData.username);
    this.intSelectedUserId = selectedData.u_id;
    this.getSelectedUserDetails(this.intSelectedUserId);
  }
  getSelectedUserDetails(id: any) {
    this.aryPublishUsers = [];
    let params = {
      "conditions": [{ "id": "User_id", "search_value": [id], "exact_match": true }],
      "page": this.intPageNumber,
      "per_page": 0,
      "use_display_id": true,
      "return_number_value": true
    }
    this.objUserService.listAllUsers(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.strGroupId = objResponse.items[0].Group_id;
        this.aryPublishUsers.push(objResponse.items[0].User_id);
        if(objResponse.items[0].Role === 3){
          this.aryPublishUsers.push(objResponse.items[0].Manager_Id);
        }
        if(this.intUserRole === 3){
          this.getAdminUsers();
        }else{
          this.aryPublishUsers = this.aryPublishUsers.concat(this.aryAdminUsers);
        }
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
  }
  searchAttendance() {
    let date = moment(this.objAttendanceForm.controls["date"].value, "DD/MM/YYYY").format('YYYY-MM-DD')
    let params = {
      "conditions": [
        {
          "id": "Date", "search_value": [date + "T00:00:00.000Z",
          date + "T00:00:00.000Z"], "exact_match": true
        },
        { "id": "Emp_id", "search_value": [this.objAttendanceForm.controls['employeeId'].value], "exact_match": true }
      ],
      "use_or_condition": false,
      "page": this.intPageNumber,
      "per_page": this.initPageSize,
      "use_display_id": true,
      "return_number_value": true
    }
    this.objAttendanceService.listAttendance(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        if (objResponse?.totalItems != 0) {
          this.blnShowSpinner = false;
          this.objCommonService.showError('Attendance of ' + this.objAttendanceForm.controls['employeeName'].value +
            ' on ' + this.objAttendanceForm.controls['date'].value + ' is already entered')
        } else {
          this.addAttendance(date);
        }
      },
      error: () => {
        this.blnShowSpinner = false;
        this.objCommonService.showError('Error')
      }
    })
  }
  getAttendance() {
    this.blnShowSpinner = false;
    let params = {
      "conditions": [
        { "id": "i_id", "search_value": [this.intItemId] }],
      "use_or_condition": false,
      "page": this.intPageNumber,
      "per_page": this.initPageSize,
      "use_display_id": true,
      "return_number_value": true
    }
    this.objAttendanceService.listAttendance(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.blnShowSpinner = false;
        this.attendanceDate = objResponse.items[0].Date;
        this.objAttendanceForm.controls['employeeId'].setValue((objResponse.items[0].Emp_id));
        this.objAttendanceForm.controls['date'].setValue(moment(objResponse.items[0].Date).format("DD/MM/YYYY"));
        this.objAttendanceForm.controls['employeeName'].setValue(objResponse.items[0].Emp_name);
        this.objAttendanceForm.controls['timeIn'].setValue(objResponse.items[0].Time_in);
        this.objAttendanceForm.controls['timeInHr'].setValue(objResponse.items[0].Time_in?.split(":")[0]);
        this.objAttendanceForm.controls['timeInMin'].setValue(objResponse.items[0].Time_in?.split(":")[1]);
        this.objAttendanceForm.controls['timeOut'].setValue(objResponse.items[0].Time_out);
        this.objAttendanceForm.controls['timeOutHr'].setValue(objResponse.items[0].Time_out?.split(":")[0]);
        this.objAttendanceForm.controls['timeOutMin'].setValue(objResponse.items[0].Time_out?.split(":")[1]);
      },
      error: () => {
        this.blnShowSpinner = false;
        this.objCommonService.showError('Error')
      }
    })
  }
  getAdminUsers() {
    let params = {
      "conditions": [{ "id": "Role", "search_value": ["1"], "exact_match": true }],
      "page": this.intPageNumber,
      "per_page": 0,
      "use_display_id": true,
      "return_number_value": true
    }
    this.objUserService.listAllUsers(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
       if(objResponse.totalItems != 0){
        for(let i = 0; i < objResponse.totalItems; i++){
          if(this.intUserRole === 3){
            this.aryPublishUsers.push(objResponse.items[i].User_id);
          }else{
            this.aryAdminUsers.push(objResponse.items[i].User_id);
          }
        }
       }
      },
      error: () => {
        this.objCommonService.showError('Error.Please try after some times')
      }
    })
  }
  addAttendance(date : any) {
    let params: any;
    let status = 0;
    if (this.intUserRole == 1 || this.intUserRole == 2) {
      params = {
        "item": {
          "Date": `${date}T00:00:00.000Z`,
          "Time_in": this.objAttendanceForm.controls['timeIn'].value,   
          "Time_out": this.objAttendanceForm.controls['timeOut'].value,
          "Emp_id": this.objAttendanceForm.controls['employeeId'].value,
          "Emp_name": this.objAttendanceForm.controls['employeeName'].value,
          "Status": status
        },
        "access_key_updates": {
          "ignore_action_settings": true,
          "users_to_publish": this.aryPublishUsers
        }
      }
    } else {
      params = {

        "item": {
          "Date": `${date}T00:00:00.000Z`,
          "Time_in": this.objAttendanceForm.controls['timeIn'].value,
          "Time_out": this.objAttendanceForm.controls['timeOut'].value,
          "Emp_id": this.objAttendanceForm.controls['employeeId'].value,
          "Emp_name": this.objAttendanceForm.controls['employeeName'].value,
          "Status": status
        }
      }
    }
    this.objAttendanceService.addAttendance(params).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.blnShowSpinner = false;
        this.openCloseModal(1);
      },
      error: () => {
        this.blnShowSpinner = false;
        this.objCommonService.showError('Error.Cannot add attendace')
      }
    })
  }
  updateAttendance() {
    let status = 0;
    let params = {
      "item": {
        "Time_in": this.objAttendanceForm.controls['timeIn'].value,
        "Time_out": this.objAttendanceForm.controls['timeOut'].value,
        "Status": status
      },
      "use_display_id": true,
      "is_force_update": true,
      "return_item_result": true
    }
    this.objAttendanceService.editAttendance(params, this.intItemId).pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        this.blnShowSpinner = false;
        this.openCloseModal(2);
      },
      error: () => {
        this.blnShowSpinner = false;
        this.objCommonService.showError('Error.Cannot edit attendace')
      }
    })
  }
  getLoggedUserId() {
    this.objCommonService.getUserDetais.pipe(takeUntil(this.objDestroyed$)).subscribe({
      next: (objResponse: any) => {
        if (objResponse) {
          this.intUserId = objResponse.userId;
          this.strUserName = objResponse.userName;
          this.intUserRole = objResponse.role;
          if (this.intUserRole == 3) {
            this.objAttendanceForm.controls['employeeId'].setValue(this.intUserId);
            this.objAttendanceForm.controls['employeeName'].setValue(this.strUserName);
            this.getSelectedUserDetails(this.intUserId);
          }
        }
      }, error: () => {
        this.objCommonService.showError('Error,please try after some times')
      }
    })
  }
  register() {
    this.blnShowSpinner = true;
    if (this.intModalId === 1) {
      this.searchAttendance();
    } else if (this.intModalId === 2) {
      this.updateAttendance();
    }
  }

  openCloseModal(intStatus: number) {
    if (intStatus === 1)
      this.objActiveModal.close(1)
    else if (intStatus === 2)
      this.objActiveModal.close(2)
    else
      this.objActiveModal.dismiss()
  }
  toggleTab(intStatus: number) {
    this.intTabIndex = intStatus
    if (this.intTabIndex == 1) {
      this.objAttendanceForm.controls['date'].setValue(new Date().toLocaleDateString('en-GB'));
      this.blnInvalidDate = false;
      this.blnFutureDate = false;
    } else {
      this.objAttendanceForm.controls['date'].setValue('');
    }
  }
  convertDateFormat(strDate : any){
    if(strDate.split('/')[0].length == 4)
    return moment(strDate).format('YYYY-MM-DD')
    else 
      return moment(strDate, "DD/MM/YYYY").format('YYYY-MM-DD')
  }
}
