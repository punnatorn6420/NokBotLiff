import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeoutPageComponent } from './timeout-page.component';

describe('TimeoutPageComponent', () => {
  let component: TimeoutPageComponent;
  let fixture: ComponentFixture<TimeoutPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimeoutPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeoutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
