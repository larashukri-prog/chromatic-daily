import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Chromatic] GameErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 gap-4">
          <p className="text-4xl">🎨</p>
          <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            The game failed to load. This is usually a one-time issue.
          </p>
          <Button onClick={this.handleReload} className="gap-2 rounded-xl">
            <RotateCcw className="w-4 h-4" />
            Reload Game
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
