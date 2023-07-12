import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AttendanceService } from './attendance.service';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { AppConstants } from '../constants/common.constants';
import {environment } from "../../../environments/environment";

fdescribe('AttendanceService', () => {
    let service: AttendanceService;
    let httpController: HttpTestingController;
    let httpClient: HttpClient;
    const url = AppConstants.API_URL_ATTENDANCE;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [AttendanceService]
        });
        service = TestBed.inject(AttendanceService);
        httpClient = TestBed.inject(HttpClient);
        httpController = TestBed.inject(HttpTestingController)
    });

    afterEach(()=>{
        httpController.verify();
    });

    fit('should be created', () => {
        expect(service).toBeTruthy();
      });

    fit('ListAttendance API to get attendance list', (done:DoneFn) => {
        const params = {
            "conditions": [
                { "id": "Status", "search_value": ["0", "1", "2"], "exact_match": true }
            ],
            "use_or_condition": false,
            "sort_fields": [
                { "id": "Date", "order": "asc" },
                { "id": "Time_in", "order": "asc" }
            ],
            "page": 1,
            "per_page": 10,
            "use_display_id": true,
            "return_number_value": true
        }
        const attendanceData = {
            "items": [
                {
                    "Date": "2002-02-20T00:00:00Z",
                    "Emp_id": "63d37231b0acb2248bc0bc8d",
                    "Emp_name": "Neil_k",
                    "ID": "000000276",
                    "Status": 1,
                    "Time_in": "10:00",
                    "Time_out": "20:00",
                    "created_at": "2023-03-09T05:24:26Z",
                    "created_by": "63d37231b0acb2248bc0bc8d",
                    "d_id": "63f3410fbe1647a695591d5e",
                    "i_id": "64096d8a638745aa9d47b51c",
                    "p_id": "63d374b06f1b489f926c55ff",
                    "rev_no": 5,
                    "status_id": "",
                    "title": "63d37231b0acb2248bc0bc8d",
                    "unread": 5,
                    "updated_at": "2023-03-20T04:28:20Z",
                    "updated_by": "63d37231b0acb2248bc0bc8d"
                },
                {
                    "Date": "2018-03-05T00:00:00Z",
                    "Emp_id": "63d37231b0acb2248bc0bc8d",
                    "Emp_name": "Neil_k",
                    "ID": "000000280",
                    "Status": 1,
                    "Time_in": "05:00",
                    "Time_out": "15:00",
                    "created_at": "2023-03-09T05:33:54Z",
                    "created_by": "63d372186f1b489f926c54cb",
                    "d_id": "63f3410fbe1647a695591d5e",
                    "i_id": "64096fc2638745aa9d47b569",
                    "p_id": "63d374b06f1b489f926c55ff",
                    "rev_no": 11,
                    "status_id": "",
                    "title": "63d37231b0acb2248bc0bc8d",
                    "unread": 8,
                    "updated_at": "2023-03-20T11:10:40Z",
                    "updated_by": "63d372186f1b489f926c54cb"
                }
            ],
            "totalItems": 2
        }

        // httpClient.post(`${url}items/search`, params).subscribe((data)=>{
        //     expect(data).toEqual(attendance);
        // });
        service.listAttendance(params).subscribe((data) => {
            expect(data).toEqual(attendanceData);
            done();
        });
        const request = httpController.expectOne(`${url}items/search`);
        request.flush(attendanceData)
        httpController.verify();
    });

    fit('Add attendance API to add new attendance', async ()=>{
        const params ={
            "access_key_updates": {
                "ignore_action_settings": true,
                "users_to_publish": ["63d372186f1b489f926c54cb", "638d93f106da0b462f006aa5", "63d372042519babc827d04c6"]
            },
            "item": {
                "Date": "2023-04-03T00:00:00.000Z",
                "Time_in": "09:00",
                "Time_out": "15:30",
                "Emp_id": "63d372186f1b489f926c54cb",
                "Emp_name": "Anu_Jose",
                "Status": 0
            }
        }
        service.addAttendance(params).subscribe({
            next: data => expect(data)
                .withContext('should return empty response')
                .toEqual(''),
            error: fail
        });
        const request = httpController.expectOne(`${url}items/new`);
        expect(request.request.method).toBe('POST');
        expect(request.request.responseType).toBe('json');
        expect(request.request.body).toEqual(params);
        const expectedResponse = new HttpResponse(
            { status: 200, statusText: 'OK', body: '' });
          request.event(expectedResponse);
    })

    fit('Add attendance API error handling for Unauthorized', ()=>{
        const params ={
            "access_key_updates": {
                "ignore_action_settings": true,
                "users_to_publish": ["63d372186f1b489f926c54cb", "638d93f106da0b462f006aa5", "63d372042519babc827d04c6"]
            },
            "item": {
                "Date": "2023-04-03T00:00:00.000Z",
                "Time_in": "09:00",
                "Time_out": "15:30",
                "Emp_id": "63d372186f1b489f926c54cb",
                "Emp_name": "Anu_Jose",
                "Status": 0
            }
        }
        service.addAttendance(params).subscribe({
            next: () => {
             fail('failing with error401')
            },
            error: (error:HttpErrorResponse) => {
             expect(error.status).toEqual(401);
             expect(error.statusText).toEqual('Unauthorized');
             expect(error.error).toBe(null);
            }
          });
        const request = httpController.expectOne(`${url}items/new`);
        request.flush(null,{status:401, statusText:'Unauthorized'});
        expect(request.cancelled).toBeTruthy();
        expect(request.request.method).toBe('POST');
    })

    fit('Add attendance API error handling for Forbidden, when user not in workspace', ()=>{
        const params ={
            "access_key_updates": {
                "ignore_action_settings": true,
                "users_to_publish": ["63d372186f1b489f926c54cb", "638d93f106da0b462f006aa5", "63d372042519babc827d04c6"]
            },
            "item": {
                "Date": "2023-04-03T00:00:00.000Z",
                "Time_in": "09:00",
                "Time_out": "15:30",
                "Emp_id": "63d372186f1b489f926c54cb",
                "Emp_name": "Anu_Jose",
                "Status": 0
            }
        }
        const errorMessage = {
            "code": 999, 
            "error_code": "SYSTEM_ERROR",
            "message": "map[error:No privileges to use the specified workspace]"
        }
        service.addAttendance(params).subscribe({
            next: () => {
              fail('failing with error403')
            },
            error: (error:HttpErrorResponse) => {
             expect(error.status).toEqual(403);
             expect(error.statusText).toEqual('Forbidden')
             expect(error.error).toEqual(errorMessage)
            }
          });
        const request = httpController.expectOne(`${url}items/new`);
        request.flush(errorMessage, {status:403, statusText:'Forbidden'});
        expect(request.cancelled).toBeTruthy();
        expect(request.request.method).toBe('POST');
    })

    fit('Edit attendance API to edit an existing attendance', async ()=>{
        const params={
            "is_force_update": true,
            "item": {
                "Time_in": "09:00",
                "Time_out": "15:30",
                "Status": 0
            },
            "return_item_result": true,
            "use_display_id": true
        }
        const editedData = {
            "error":"",
            "item": {
                "Date": "2023-01-17T00:00:00Z",
                "Emp_id": "63d8b462aae7fc378cec0ac1",
                "Emp_name": "rami_mhmd",
                "ID": "000000390",
                "Status": 0,
                "Time_in": "09:00",
                "Time_out": "15:30",
                "created_at": "2023-03-24T04:35:49Z",
                "created_by": "63d372042519babc827d04c6",
                "d_id": "63f3410fbe1647a695591d5e",
                "i_id": "641d28a5b9e781f6cf037ab2",
                "p_id": "63d374b06f1b489f926c55ff",
                "rev_no": 2,
                "status_id": "",
                "title": "63d8b462aae7fc378cec0ac1",
                "unread": 0,
                "updated_at": "2023-04-03T10:53:32Z",
                "updated_by": "63d372042519babc827d04c6"
            }
        }
        const itemid = "641d28a5b9e781f6cf037ab2"
        service.editAttendance(params,itemid).subscribe({
            next: data => expect(data)
                .withContext('should return the edited attendance')
                .toEqual(editedData),
            error: fail
        });
        const request = httpController.expectOne(`${url}items/edit/${itemid}`);
        expect(request.request.method).toBe('POST');
        expect(request.request.responseType).toBe('json');
        expect(request.request.body).toEqual(params);
        const expectedResponse = new HttpResponse(
            { status: 200, statusText: 'OK', body: editedData });
          request.event(expectedResponse);
    })

    fit('Bulk Update attendance API to update the employee name', async ()=>{
        const params={
            "conditions": [
              {
                "id": "Emp_id",
                "search_value": ["63fc896aac9ec7e1534a93bb"],
                "exact_match": true
              }
            ],
             "item": {
              "Emp_name": "Anu_Jose_User"
            },
            "max_items": 300,
            "use_display_id": true,
            "continue_proc": true
          }
        const responseData = {
            "errors": [],
            "has_error": false,
            "result": {
                "matched": 5,
                "processed": 5
            }
        }
        service.bulkUpdateAttendance(params).subscribe({
            next: data => expect(data)
                .withContext('should return the response')
                .toEqual(responseData),
            error: fail
        });
        const request = httpController.expectOne(`${url}items/bulkaction/${environment.attendance_update_action_id}`);
        expect(request.request.method).toBe('POST');
        expect(request.request.responseType).toBe('json');
        expect(request.request.body).toEqual(params);
        const expectedResponse = new HttpResponse(
            { status: 200, statusText: 'OK', body: responseData });
          request.event(expectedResponse);
    })

    fit('Bulk Delete Attendance API to delete multiple attendances', () => {
        const params = {
            "conditions": [
              { "id": "Emp_id", "search_value": ["63fc896aac9ec7e1534a93bb"] }
            ],
            "use_display_id": true
        }
        service.bulkDeleteAttendance(params).subscribe({
            next: data => expect(data)
                .withContext('should return the response')
                .toEqual(null),
            error: fail
        });
        const request = httpController.expectOne( `${url}items/delete`);
        request.flush(null);
      });
    
});