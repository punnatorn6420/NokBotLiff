import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CounterServicePageComponent } from './counter-service-page.component';

describe('CounterServicePageComponent', () => {
  let component: CounterServicePageComponent;
  let fixture: ComponentFixture<CounterServicePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CounterServicePageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CounterServicePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
