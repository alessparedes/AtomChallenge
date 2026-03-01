import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Deploy } from './deploy';

describe('Deploy', () => {
  let component: Deploy;
  let fixture: ComponentFixture<Deploy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Deploy]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Deploy);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
