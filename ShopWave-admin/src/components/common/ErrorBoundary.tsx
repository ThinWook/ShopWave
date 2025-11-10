import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error | null };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Send to monitoring/logging if desired
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 flex items-center justify-center h-screen">
          <div className="max-w-lg text-center">
            <h2 className="text-2xl font-semibold mb-2">Something went wrong.</h2>
            <p className="text-sm text-muted-foreground mb-4">An unexpected error occurred while rendering the page.</p>
            <details className="text-left text-xs whitespace-pre-wrap">
              {this.state.error?.stack}
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
