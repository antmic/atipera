import { Component, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PeriodicTableComponent } from './periodic-table/periodic-table.component';
import { EditElementDialog } from './edit-element-dialog/edit-element-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PeriodicTableComponent, EditElementDialog],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'atipera';
}
