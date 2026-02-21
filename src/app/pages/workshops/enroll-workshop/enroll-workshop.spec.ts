import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EnrollWorkshop } from './enroll-workshop';

describe('EnrollWorkshop', () => {
  let component: EnrollWorkshop;
  let fixture: ComponentFixture<EnrollWorkshop>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EnrollWorkshop]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EnrollWorkshop);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
