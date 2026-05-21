// The home route / is served by the root app/page.tsx (which includes Providers + BottomNav).
// This stub exists to satisfy Next.js route-group page validation for the (app) group.
// Since app/page.tsx takes precedence, this component is never actually rendered.
export default function HomeStub() {
  return null;
}
