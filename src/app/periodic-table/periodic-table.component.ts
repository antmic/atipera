import { Component, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PeriodicElement } from '../models/periodic-element.model';
import { ELEMENT_DATA } from '../data/element-data';
import { EditElementDialog } from '../edit-element-dialog/edit-element-dialog.component';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { v4 as uuidv4 } from 'uuid';
import { CommonModule } from '@angular/common';
import { ConfirmActionDialogComponent } from '../confirm-action-dialog/confirm-action-dialog.component';

@Component({
  selector: 'app-periodic-table',
  templateUrl: './periodic-table.component.html',
  styleUrls: ['./periodic-table.component.scss'],
  standalone: true,
  imports: [
    MatTableModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    CommonModule,
  ],
})
export class PeriodicTableComponent implements OnInit {
  displayedColumns: string[] = [
    'position',
    'name',
    'weight',
    'symbol',
    'actions',
  ];
  dataSource = new MatTableDataSource<PeriodicElement>();
  private debounceTimer: any;

  // State and history stacks
  public history: PeriodicElement[][] = [];
  public future: PeriodicElement[][] = [];

  constructor(public dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadData();
    this.loadState();
    this.dataSource.filterPredicate = this.createFilter();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.dataSource.filter = filterValue;
    }, 2000);
  }

  clearFilter(input: HTMLInputElement) {
    input.value = '';
    this.dataSource.filter = '';
  }

  createFilter(): (data: PeriodicElement, filter: string) => boolean {
    return (data: PeriodicElement, filter: string): boolean => {
      const filterStr = filter.toLowerCase();
      return (
        data.name.toLowerCase().includes(filterStr) ||
        data.symbol.toLowerCase().includes(filterStr) ||
        data.position.toString().includes(filterStr) ||
        data.weight.toString().includes(filterStr)
      );
    };
  }

  editElement(element: PeriodicElement) {
    const dialogRef = this.dialog.open(EditElementDialog, {
      width: '330px',
      data: { ...element, isNew: false },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.updateState();
        const index = this.dataSource.data.findIndex((e) => e.id === result.id);
        const updatedData = [...this.dataSource.data];
        updatedData[index] = result;
        this.dataSource.data = this.sortElements(updatedData);
        this.saveData();
      }
    });
  }

  addElement() {
    const dialogRef = this.dialog.open(EditElementDialog, {
      width: '330px',
      data: {
        id: uuidv4(),
        position: null,
        name: '',
        weight: null,
        symbol: '',
        isNew: true,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.updateState();
        const updatedData = [...this.dataSource.data, result];
        this.dataSource.data = this.sortElements(updatedData);
        this.saveData();
      }
    });
  }

  removeElement(id: string) {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '330px',
      data: { isReset: false },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.updateState();
        const updatedData = this.dataSource.data.filter(
          (element) => element.id !== id
        );
        this.dataSource.data = this.sortElements(updatedData);
        this.saveData();
      }
    });
  }

  saveData() {
    localStorage.setItem(
      'periodicTableData',
      JSON.stringify(this.dataSource.data)
    );
  }

  // Mock function to push data to the server
  pushDataToServer() {
    this.saveData();
    // would push this.dataSource.data to the server
  }

  resetData() {
    const dialogRef = this.dialog.open(ConfirmActionDialogComponent, {
      width: '250px',
      data: { isReset: true },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        localStorage.removeItem('periodicTableData');
        this.dataSource.data = this.sortElements(
          ELEMENT_DATA.map((element) => ({
            ...element,
            id: uuidv4(),
          }))
        );
        this.history = [];
        this.future = [];
      }
    });
  }

  loadData() {
    const savedData = localStorage.getItem('periodicTableData');
    if (savedData) {
      this.dataSource.data = this.sortElements(JSON.parse(savedData));
    } else {
      this.dataSource.data = this.sortElements(
        ELEMENT_DATA.map((element) => ({
          ...element,
          id: uuidv4(),
        }))
      );
    }
  }

  private sortElements(elements: PeriodicElement[]): PeriodicElement[] {
    return elements.sort((a, b) => {
      if (a.position === b.position) {
        return a.weight - b.weight;
      }
      return a.position - b.position;
    });
  }

  // Save the current state to the history stack
  private saveState() {
    localStorage.setItem('periodicStateHistory', JSON.stringify(this.history));
    localStorage.setItem('periodicStateFuture', JSON.stringify(this.future));
  }

  private updateState() {
    this.history.push([...this.dataSource.data]);
    this.future = []; // Clear the future stack
    this.saveState();
  }

  // Load the state from the history stack
  private loadState() {
    const savedHistory = localStorage.getItem('periodicStateHistory');
    if (savedHistory) {
      this.history = JSON.parse(savedHistory);
    }
    const savedFuture = localStorage.getItem('periodicStateFuture');
    if (savedFuture) {
      this.future = JSON.parse(savedFuture);
    }
  }

  // Undo the last change
  undo() {
    if (this.history.length > 0) {
      this.future.push([...this.dataSource.data]);
      this.dataSource.data = this.history.pop()!;
      this.saveData();
      this.saveState();
    }
  }

  // Redo the last undone change
  redo() {
    if (this.future.length > 0) {
      this.history.push([...this.dataSource.data]);
      this.dataSource.data = this.future.pop()!;
      this.saveData();
      this.saveState();
    }
  }
}
