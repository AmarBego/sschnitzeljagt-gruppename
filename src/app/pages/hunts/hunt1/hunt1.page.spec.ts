import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Hunt1Page } from './hunt1.page';

describe('Hunt1Page', () => {
  let component: Hunt1Page;
  let fixture: ComponentFixture<Hunt1Page>;

  beforeEach(() => {
    fixture = TestBed.createComponent(Hunt1Page);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
