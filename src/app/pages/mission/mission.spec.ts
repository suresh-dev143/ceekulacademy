import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mission } from './mission';

describe('Mission', () => {
  let component: Mission;
  let fixture: ComponentFixture<Mission>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mission]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mission);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
