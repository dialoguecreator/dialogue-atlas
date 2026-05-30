import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

interface Props {
  children: ReactNode;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
    this.setState({ error, info });
  }

  reset = () => this.setState({ error: null, info: null });

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-bg p-8">
          <div className="max-w-2xl rounded-lg border border-red-200 bg-surface p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-red-700">
              Something crashed
            </h1>
            <p className="mt-2 text-sm text-ink-muted">
              The app caught an error and stopped rendering this view. Details
              below — share with Daniel/Claude to fix.
            </p>
            <pre className="mt-4 max-h-64 overflow-auto rounded bg-bg-panel p-3 text-xs leading-relaxed text-ink">
              {this.state.error.message}
              {"\n\n"}
              {this.state.error.stack}
              {this.state.info && "\n\nComponent stack:\n" + this.state.info.componentStack}
            </pre>
            <button onClick={this.reset} className="btn btn-primary mt-4">
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
