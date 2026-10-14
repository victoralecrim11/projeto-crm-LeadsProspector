import assert from 'node:assert/strict';
import test from 'node:test';
import type { AppNotification, Lead, Project } from '../../src/types';

test('lead store survives unavailable browser storage and uses one persistence adapter', async t => {
  const originalLocal = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const originalSession = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  t.after(() => {
    for (const [key, descriptor] of [['localStorage', originalLocal], ['sessionStorage', originalSession]] as const) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  t.mock.method(console, 'warn', () => {});
  const memory = new Map<string, string>();
  const session = { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => { memory.set(key, value); } };
  const lead: Lead = { id: 'manual', name: 'Manual lead', category: 'Serviços', niche: 'Serviços', city: 'BH', state: 'MG', address: '', phone: '', hasWebsite: false, inCrm: false, temperature: 'frio', score: 0, createdAt: '2026-01-01', dataSource: 'manual' };
  const notification: AppNotification = { id: 'n1', title: 'Test', message: 'Test', timestamp: '2026-01-01', read: false, type: 'system' };
  memory.set('leadsite_crm_leads_v2', JSON.stringify([lead]));
  memory.set('leadsite_crm_notifications_v2', JSON.stringify([notification]));
  memory.set('leadsite_crm_appointments_v2', '[]');
  memory.set('leadsite_crm_projects_v2', JSON.stringify([{ id: 'p1' }]));
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new DOMException('Blocked', 'SecurityError'); } });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: session });
  const { useLeadStore } = await import('../../src/store/leadStore');
  assert.equal(useLeadStore.getState().leads[0]?.id, 'manual');
  assert.equal(useLeadStore.getState().notifications[0]?.id, 'n1');
  assert.equal(useLeadStore.getState().projects[0]?.id, 'p1');

  await t.test('quota failures retain updates in session storage', () => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem: () => null,
      setItem: () => { throw new DOMException('Full', 'QuotaExceededError'); },
    } });
    const state = useLeadStore.getState();
    state.setLeads([lead]);
    state.setAppointments([]);
    state.setProjects([{ id: 'p2' } as Project]);
    state.addNotification({ ...notification, id: 'n2' });
    state.markNotificationAsRead('n1');
    state.markAllNotificationsAsRead();
    assert.equal(JSON.parse(memory.get('leadsite_crm_leads_v2')!)[0].id, 'manual');
    assert.deepEqual(JSON.parse(memory.get('leadsite_crm_appointments_v2')!), []);
    assert.equal(JSON.parse(memory.get('leadsite_crm_projects_v2')!)[0].id, 'p2');
    const saved = JSON.parse(memory.get('leadsite_crm_notifications_v2')!) as AppNotification[];
    assert.equal(saved.length, 2);
    assert.ok(saved.every(item => item.read));
  });

  await t.test('when both storage backends are blocked the store still updates in memory', () => {
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new DOMException('Blocked', 'SecurityError'); } });
    const state = useLeadStore.getState();
    state.setLeads([]);
    state.setAppointments([]);
    state.setProjects([]);
    state.addNotification({ ...notification, id: 'n3' });
    state.markNotificationAsRead('n3');
    state.markAllNotificationsAsRead();
    assert.deepEqual(useLeadStore.getState().leads, []);
    assert.deepEqual(useLeadStore.getState().projects, []);
    assert.ok(useLeadStore.getState().notifications.find(item => item.id === 'n3')?.read);
  });
});
