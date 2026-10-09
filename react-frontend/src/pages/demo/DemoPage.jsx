/**
 * DemoPage.jsx — Phase 1 Demo Page
 * ==================================
 * A temporary placeholder page that demonstrates the AppShell working.
 * Each team member will replace this with their actual portal pages.
 *
 * Usage pattern (how every page will look going forward):
 *
 *   import AppShell from '../../components/layout/AppShell';
 *
 *   export default function MyPage() {
 *     return (
 *       <AppShell pageTitle="My Page Name">
 *         <p>My page content here</p>
 *       </AppShell>
 *     );
 *   }
 */

import AppShell from '../../components/layout/AppShell';

export default function DemoPage({ pageTitle = 'Dashboard' }) {
  return (
    <AppShell pageTitle={pageTitle}>
      {/* ── DEMO CONTENT ─── replace this with real page content ── */}
      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '32px',
        boxShadow: 'var(--shadow)',
      }}>
        <h2 style={{ fontFamily: 'Sora, sans-serif', marginBottom: '12px' }}>
          ✅ Phase 1 Complete — AppShell is Working!
        </h2>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
          The <strong>Sidebar</strong> and <strong>Topbar</strong> are now React components.
          This placeholder renders inside <code>{'<AppShell>'}</code>.
          Replace this with your portal's actual page content.
        </p>
        <p style={{ marginTop: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Current page: <strong>{pageTitle}</strong>
        </p>
      </div>
    </AppShell>
  );
}
