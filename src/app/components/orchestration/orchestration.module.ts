import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { SplitScreenLayoutComponent } from './split-screen-layout.component';
import { ChatSessionComponent } from './chat-session.component';
import { OverlaySystemComponent } from './overlay-system.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    SplitScreenLayoutComponent,
    ChatSessionComponent,
    OverlaySystemComponent
  ],
  exports: [
    SplitScreenLayoutComponent,
    ChatSessionComponent,
    OverlaySystemComponent
  ]
})
export class OrchestrationModule { }
