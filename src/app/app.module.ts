import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { ConverterComponent } from './converter/converter.component';

import { ClipboardModule } from '@angular/cdk/clipboard';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

@NgModule({
  declarations: [
    AppComponent,
    ConverterComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
    FontAwesomeModule,
    TooltipModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
