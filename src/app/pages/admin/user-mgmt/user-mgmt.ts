import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CuapService } from '../../../services/cuap.service';

@Component({
  selector: 'app-user-mgmt',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="cuap-module">
  <div class="cuap-module__header">
    <span class="cuap-module__label">MODULE — USER MANAGEMENT</span>
    <h2 class="cuap-module__title">Identity & Access Control</h2>
    <p class="cuap-module__sub">{{ cuap.userStats().total | number }} registered · CB ID system · Role-gated access · Fraud signals</p>
  </div>

  <div class="umg-stats">
    <div class="umg-stat">
      <span class="umg-stat__label">TOTAL USERS</span>
      <span class="umg-stat__value">{{ cuap.userStats().total | number }}</span>
    </div>
    <div class="umg-stat">
      <span class="umg-stat__label">ACTIVE TODAY</span>
      <span class="umg-stat__value">{{ cuap.userStats().activeToday | number }}</span>
    </div>
    <div class="umg-stat">
      <span class="umg-stat__label">NEW THIS WEEK</span>
      <span class="umg-stat__value adm-green">+{{ cuap.userStats().newThisWeek | number }}</span>
    </div>
    <div class="umg-stat">
      <span class="umg-stat__label">SUSPENDED</span>
      <span class="umg-stat__value adm-red">{{ cuap.userStats().suspended }}</span>
    </div>
    <div class="umg-stat">
      <span class="umg-stat__label">PENDING KYC</span>
      <span class="umg-stat__value adm-amber">{{ cuap.userStats().pendingKyc }}</span>
    </div>
  </div>

  <div class="umg-search">
    <span class="umg-search__prefix">⟐</span>
    <input class="umg-search__input" type="text" placeholder="Search by CB ID, name, or email…"
      [value]="searchQuery()"
      (input)="searchQuery.set($any($event.target).value)" />
  </div>

  <div class="umg-table">
    <div class="umg-table__head">
      <span>CB ID</span><span>Name</span><span>Role</span><span>Neurons</span><span>Status</span><span>Joined</span><span></span>
    </div>
    @for (user of cuap.filteredUsers(searchQuery()); track user.cbId) {
    <div class="umg-row">
      <code class="umg-row__cbid">{{ user.cbId }}</code>
      <span class="umg-row__name">{{ user.name }}</span>
      <span class="umg-row__role umg-row__role--{{ user.role }}">{{ user.role }}</span>
      <span class="umg-row__neurons">{{ user.neurons | number }}</span>
      <span class="umg-row__status umg-row__status--{{ user.status }}">{{ user.status }}</span>
      <span class="umg-row__joined">{{ user.joinedAt | date:'mediumDate' }}</span>
      <div class="umg-row__actions">
        <button class="umg-action-btn">View</button>
      </div>
    </div>
    }
  </div>
</div>`,
  styles: [`
.cuap-module { display: flex; flex-direction: column; gap: 1.25rem; }
.cuap-module__label { font-size: .55rem; font-weight: 800; letter-spacing: .22em; color: #3a4a6a; display: block; margin-bottom: .25rem; }
.cuap-module__title { font-size: 1.25rem; font-weight: 700; color: #c8d8f0; margin: 0 0 .2rem; }
.cuap-module__sub   { font-size: .65rem; color: #3a4a6a; margin: 0; }
.umg-stats { display: grid; grid-template-columns: repeat(5,1fr); gap: .5rem; }
.umg-stat  { background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 8px; padding: .875rem 1rem; text-align: center; }
.umg-stat__label { font-size: .52rem; font-weight: 800; letter-spacing: .14em; color: #3a4a6a; display: block; margin-bottom: .4rem; }
.umg-stat__value { font-size: 1.25rem; font-weight: 800; color: #c8d8f0; }
.adm-green { color: #22c55e; }
.adm-red   { color: #ff3366; }
.adm-amber { color: #ff9900; }
.umg-search { display: flex; align-items: center; gap: .5rem; background: #080c15; border: 1px solid rgba(0,245,255,.15); border-radius: 8px; padding: .625rem 1rem; }
.umg-search__prefix { color: #3a4a6a; }
.umg-search__input  { flex: 1; background: transparent; border: none; color: #c8d8f0; font-size: .82rem; outline: none; }
.umg-search__input::placeholder { color: #3a4a6a; }
.umg-table { background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 10px; overflow: hidden; }
.umg-table__head { display: grid; grid-template-columns: 120px 1fr 80px 80px 80px 100px 60px; gap: .5rem; padding: .5rem 1rem; font-size: .52rem; font-weight: 800; letter-spacing: .14em; color: #3a4a6a; border-bottom: 1px solid rgba(0,245,255,.06); }
.umg-row { display: grid; grid-template-columns: 120px 1fr 80px 80px 80px 100px 60px; gap: .5rem; align-items: center; padding: .625rem 1rem; border-bottom: 1px solid rgba(255,255,255,.02); font-size: .72rem; }
.umg-row:last-child { border-bottom: none; }
.umg-row__cbid    { font-family: 'Courier New', monospace; font-size: .65rem; color: #00f5ff; opacity: .8; }
.umg-row__name    { color: #c8d8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.umg-row__role    { font-size: .58rem; font-weight: 700; letter-spacing: .06em; padding: .15rem .4rem; border-radius: 4px; text-align: center; }
.umg-row__role--admin   { color: #a78bfa; background: rgba(167,139,250,.1); }
.umg-row__role--creator { color: #00f5ff; background: rgba(0,245,255,.08); }
.umg-row__role--user    { color: #3a4a6a; background: rgba(58,74,106,.12); }
.umg-row__neurons { color: #ff9900; text-align: center; }
.umg-row__status  { font-size: .58rem; font-weight: 700; text-align: center; padding: .12rem .3rem; border-radius: 4px; }
.umg-row__status--active    { color: #22c55e; background: rgba(34,197,94,.08); }
.umg-row__status--suspended { color: #ff3366; background: rgba(255,51,102,.08); }
.umg-row__status--pending   { color: #ff9900; background: rgba(255,153,0,.08); }
.umg-row__joined  { font-size: .65rem; color: #3a4a6a; }
.umg-row__actions { display: flex; justify-content: flex-end; }
.umg-action-btn { background: transparent; border: 1px solid rgba(0,245,255,.15); border-radius: 4px; color: #3a4a6a; font-size: .6rem; padding: .2rem .5rem; cursor: pointer; transition: all .12s; }
.umg-action-btn:hover { color: #00f5ff; border-color: rgba(0,245,255,.35); }
  `],
})
export class UserMgmt {
  readonly cuap = inject(CuapService);
  readonly searchQuery = signal('');
}
