/**
 * Thin wrapper to point the dashboard module loader to the new Instructor Teaching Dashboard
 * The UniversalDashboard lazy-loads this path:
 *   React.lazy(() => import('./Modules/TeachingDashboard'))
 * Previously this file contained the legacy assignment-centric view.
 * We now delegate to the new implementation at:
 *   src/features/instructor/pages/TeachingDashboard.tsx
 *
 * This allows roleConfig / existing dynamic import strings to remain unchanged
 * while exposing the new functionality (upcoming classes, payout summary, ratings, etc).
 */

import { TeachingDashboard as InstructorTeachingDashboard } from '../../../instructor/pages/TeachingDashboard';

export default function TeachingDashboard() {
  return <InstructorTeachingDashboard />;
}
