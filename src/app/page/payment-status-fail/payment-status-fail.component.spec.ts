import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentStatusFailComponent } from './payment-status-fail.component';

describe('PaymentStatusFailComponent', () => {
  let component: PaymentStatusFailComponent;
  let fixture: ComponentFixture<PaymentStatusFailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentStatusFailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentStatusFailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
