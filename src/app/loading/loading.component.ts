import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent implements OnInit, OnDestroy {
  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.renderer.addClass(this.document.body, 'no-scroll');
    this.renderer.addClass(this.document.documentElement, 'no-scroll');
  }

  ngOnDestroy(): void {
    this.renderer.removeClass(this.document.body, 'no-scroll');
    this.renderer.removeClass(this.document.documentElement, 'no-scroll');
  }
}
