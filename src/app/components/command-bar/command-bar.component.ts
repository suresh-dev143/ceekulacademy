import {
  Component, inject, HostListener, ElementRef, ViewChild,
  AfterViewInit, effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommandService, Command, CommandCategory } from '../../services/command.service';

const CATEGORY_LABEL: Record<CommandCategory, string> = {
  navigate:  'NAVIGATE',
  panel:     'PANEL LAYOUT',
  sync:      'DEVICE SYNC',
  workspace: 'WORKSPACE',
};

@Component({
  selector: 'app-command-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './command-bar.component.html',
  styleUrl: './command-bar.component.scss',
})
export class CommandBarComponent implements AfterViewInit {

  protected readonly cmd = inject(CommandService);
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  constructor() {
    // Auto-focus the input whenever the bar opens
    effect(() => {
      if (this.cmd.isOpen()) {
        setTimeout(() => this.searchInput?.nativeElement.focus(), 30);
      }
    });
  }

  ngAfterViewInit(): void {}

  // ── Keyboard plumbing ──────────────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  onGlobalKey(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      this.cmd.toggle();
    }
    if (!this.cmd.isOpen()) return;
    if (e.key === 'Escape')    { this.cmd.close(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); this.cmd.moveDown(); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); this.cmd.moveUp();   }
    if (e.key === 'Enter')     { e.preventDefault(); this.cmd.executeFocused(); }
  }

  // ── Template helpers ────────────────────────────────────────────────────────

  onQueryChange(q: string): void { this.cmd.setQuery(q); }
  execute(i: number): void { this.cmd.executeAt(i); }
  categoryLabel(cat: CommandCategory): string { return CATEGORY_LABEL[cat]; }

  /** Returns true when this command starts a new category section. */
  isNewCategory(cmds: Command[], i: number): boolean {
    return i === 0 || cmds[i].category !== cmds[i - 1].category;
  }
}
