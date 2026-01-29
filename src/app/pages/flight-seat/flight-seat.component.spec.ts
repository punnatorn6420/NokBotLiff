import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlightSeatComponent } from './flight-seat.component';

describe('FlightSeatComponent', () => {
  let component: FlightSeatComponent;
  let fixture: ComponentFixture<FlightSeatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FlightSeatComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlightSeatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
