import { DebugElement } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BrowserModule, By } from '@angular/platform-browser';
import { NgbModule, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrModule } from 'ngx-toastr';
import { AttendanceModalComponent } from './attendance-modal.component';

fdescribe('AttendanceModalComponent', () => {
  let component: AttendanceModalComponent;
  let fixture: ComponentFixture<AttendanceModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AttendanceModalComponent],
      imports: [NgbModule, ToastrModule.forRoot(), FormsModule, ReactiveFormsModule, BrowserModule],
      providers: [NgbActiveModal, HttpClient, HttpHandler]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AttendanceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('Test1: Should render title for Add modal', async () => {
    component.intModalId = 1;
    fixture.detectChanges();
    const h2 = fixture.debugElement.nativeElement.querySelector('h2');
    expect(h2.textContent).toContain('Add Attendance');
    const button = fixture.debugElement.query(By.css('.formbold-btn'));
    expect(button.nativeElement.textContent).toContain('Register');
  });

  it('Test2: Should render title for Edit modal', async () => {
    component.intModalId = 2;
    fixture.detectChanges();
    const h2 = fixture.debugElement.nativeElement.querySelector('h2');
    expect(h2.textContent).toContain('Edit Attendance');
    const button = fixture.debugElement.query(By.css('.formbold-btn'));
    expect(button.nativeElement.textContent).toContain('Update');
  });

  it('Test3: Should call register method while clicking Register button', async () => {
    component.intModalId = 1;
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('.formbold-btn'));
    spyOn(component, 'register');
    button.triggerEventHandler('click', null);
    expect(component.register).toHaveBeenCalled();
  });

  it('Test4: Form should be invalid if atleast one field is empty', async () => {
    component.intModalId = 1;
    fixture.detectChanges();
    component.objAttendanceForm.controls['date'].setValue('2000-01-01');
    component.objAttendanceForm.controls['employeeId'].setValue(1);
    component.objAttendanceForm.controls['employeeName'].setValue("TestUser");
    component.objAttendanceForm.controls['timeIn'].setValue('10:00');
    component.objAttendanceForm.controls['timeOut'].setValue('');
    component.objAttendanceForm.controls['timeInHr'].setValue('10');
    component.objAttendanceForm.controls['timeInMin'].setValue('00');
    component.objAttendanceForm.controls['timeOutHr'].setValue('18');
    component.objAttendanceForm.controls['timeOutMin'].setValue('30');
    expect(component.objAttendanceForm.valid).toBeFalsy();

    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('.formbold-btn'));
    expect(button.nativeElement.disabled).toBeTruthy();
  });

  it('Test5: Form should be valid if all fields are filled', async () => {
    component.intModalId = 2;
    fixture.detectChanges();
    component.objAttendanceForm.controls['date'].setValue('02/03/2023');
    component.objAttendanceForm.controls['employeeId'].setValue(1);
    component.objAttendanceForm.controls['employeeName'].setValue("TestUser");
    component.objAttendanceForm.controls['timeIn'].setValue('10:00');
    component.objAttendanceForm.controls['timeOut'].setValue('18:30');
    component.objAttendanceForm.controls['timeInHr'].setValue('10');
    component.objAttendanceForm.controls['timeInMin'].setValue('00');
    component.objAttendanceForm.controls['timeOutHr'].setValue('18');
    component.objAttendanceForm.controls['timeOutMin'].setValue('30');
    expect(component.objAttendanceForm.valid).toBeTruthy();

    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('.formbold-btn'));
    expect(button.nativeElement.disabled).toBeFalsy();
  });

  it('Test6: Error should be shown for time-in greater than time-out', async () => {
    component.intModalId = 1;
    fixture.detectChanges();
    component.objAttendanceForm.controls['timeIn'].setValue('19:00');
    component.objAttendanceForm.controls['timeOut'].setValue('11:00');
    component.objAttendanceForm.controls['timeInHr'].setValue('19');
    component.objAttendanceForm.controls['timeInMin'].setValue('00');
    component.objAttendanceForm.controls['timeOutHr'].setValue('11');
    component.objAttendanceForm.controls['timeOutMin'].setValue('00');
    component.timeCheck();
    expect(component.blnTimeError).toBeTruthy();

    fixture.detectChanges(); 
    const errorMsg = fixture.debugElement.query(By.css('.error'));
    expect(errorMsg.nativeElement.textContent).toContain('Time out should be greater than Time in');
  });

  it('Test7: Should be called the event listener for date change', async () => {
    component.intModalId = 1;
    fixture.detectChanges();
    const dateInput = fixture.debugElement.query(By.css('.dp-input'));
    spyOn(component, 'dateCheck');
    component.objAttendanceForm.controls['date'].setValue('02/03/2008');
    dateInput.triggerEventHandler('change', {});
    expect(component.dateCheck).toHaveBeenCalled();
  });

  it('Test8: Error should be shown for a date before the year 2000', async () => {
    component.intModalId = 1;
    fixture.detectChanges();
    component.objAttendanceForm.controls['date'].setValue('02/03/1998');
    component.dateCheck();
    expect(component.blnInvalidDate).toBeTruthy();

    fixture.detectChanges();
    const errorMsg = fixture.debugElement.query(By.css('.error'));
    expect(errorMsg.nativeElement.textContent).toContain('Dates prior to the year 2000 are not accepted');
  });

  it('Test9: Error should be shown for a future date', async () => {
    component.intModalId = 1;
    fixture.detectChanges();
    component.objAttendanceForm.controls['date'].setValue('12/05/2025');
    component.dateCheck();
    expect(component.blnFutureDate).toBeTruthy();

    fixture.detectChanges();
    const errorMsg = fixture.debugElement.query(By.css('.error'));
    expect(errorMsg.nativeElement.textContent).toContain('Future dates are not permitted');
  });

  it('Test10: Error should be shown for an invalid date format', async () => {
    component.intModalId = 1;
    fixture.detectChanges();
    component.objAttendanceForm.controls['date'].setValue('2000-01-01');
    component.dateCheck();
    expect(component.blnIsValidDate).toBeFalsy();

    fixture.detectChanges();
    const errorMsg = fixture.debugElement.query(By.css('.error'));
    expect(errorMsg.nativeElement.textContent).toContain('Invalid date');
  });

});
