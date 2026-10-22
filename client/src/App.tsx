import { Component, Suspense, lazy, type ErrorInfo, type ReactNode } from 'react';
import { Route, Switch } from 'wouter';
import { Loading, ScrollManager, Shell } from './components';
import { Checkout, Confirmation, Home, MenuPage, NotFound, Track } from './pages';
import { useConfig, useStorefront } from './data';
const Owner = lazy(() => import('./Owner'));
class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.error('Hushgrain could not render:', error.message);
  }
  render() {
    return this.state.failed ? (
      <Loading
        error="Something interrupted the café. Please reload and try again."
        retry={() => window.location.reload()}
      />
    ) : (
      this.props.children
    );
  }
}
function CafeApp() {
  const config = useConfig();
  const storefront = useStorefront();
  if (config.error || storefront.error)
    return (
      <Loading
        error="We couldn’t reach the café. Let’s try that again."
        retry={() => {
          void config.refetch();
          void storefront.refetch();
        }}
      />
    );
  if (!config.data || !storefront.data) return <Loading />;
  return (
    <Shell>
      <ScrollManager />
      <Suspense fallback={<Loading />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/menu" component={MenuPage} />
          <Route path="/checkout" component={Checkout} />
          <Route path="/confirmation/:reference" component={Confirmation} />
          <Route path="/track" component={Track} />
          <Route path="/owner" component={Owner} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </Shell>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <CafeApp />
    </ErrorBoundary>
  );
}
