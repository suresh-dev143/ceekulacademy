import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWorkshop } from './create-workshop';

describe('CreateWorkshop', () => {
  let component: CreateWorkshop;
  let fixture: ComponentFixture<CreateWorkshop>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateWorkshop]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateWorkshop);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
