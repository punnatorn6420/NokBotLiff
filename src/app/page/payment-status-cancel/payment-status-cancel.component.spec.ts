import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentStatusCancelComponent } from './payment-status-cancel.component';

describe('PaymentStatusCancelComponent', () => {
  let component: PaymentStatusCancelComponent;
  let fixture: ComponentFixture<PaymentStatusCancelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentStatusCancelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentStatusCancelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
