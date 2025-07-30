// src/app/alert-error/alert-error.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-alert-error',
  templateUrl: './alert-error.component.html',
  styleUrls: ['./alert-error.component.scss']
})
export class AlertErrorComponent implements OnInit {

  constructor(
    private router: Router,
    private location: Location
  ) { }

  ngOnInit() {
    // เพิ่ม animation เมื่อโหลดหน้า
    setTimeout(() => {
      const container = document.querySelector('.error-container');
      if (container) {
        container.classList.add('fade-in');
      }
    }, 100);
  }

  retry() {
    // ลองโหลดหน้าใหม่
    window.location.reload();
  }

  goBack() {
    // กลับไปหน้าเดิม
    this.location.back();
  }

  goHome() {
    // กลับไปหน้าหลัก
    this.router.navigate(['/']);
  }
}
