import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentStatusSuccessComponent } from './payment-status-success.component';

describe('PaymentStatusSuccessComponent', () => {
  let component: PaymentStatusSuccessComponent;
  let fixture: ComponentFixture<PaymentStatusSuccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentStatusSuccessComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentStatusSuccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
