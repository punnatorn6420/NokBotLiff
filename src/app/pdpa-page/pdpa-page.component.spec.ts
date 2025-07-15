import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PdpaPageComponent } from './pdpa-page.component';

describe('PdpaPageComponent', () => {
  let component: PdpaPageComponent;
  let fixture: ComponentFixture<PdpaPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PdpaPageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PdpaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
