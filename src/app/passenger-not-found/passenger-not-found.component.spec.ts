import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassengerNotFoundComponent } from './passenger-not-found.component';

describe('PassengerNotFoundComponent', () => {
  let component: PassengerNotFoundComponent;
  let fixture: ComponentFixture<PassengerNotFoundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PassengerNotFoundComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassengerNotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
