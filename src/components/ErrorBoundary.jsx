import { Component } from 'react';

// Last line of defence: if any tab throws during render, show a recoverable
// panel instead of white-screening the whole admin app.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Admin panel render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-8">
          <div className="max-w-lg mx-auto mt-10 bg-[#1C1914] border border-[#5E2A2A] rounded-lg p-6 text-center">
            <div className="text-[#E0716A] font-medium mb-2">Something went wrong on this screen.</div>
            <div className="text-[#8A8375] text-sm mb-4 break-words">
              {this.state.error?.message || 'Unexpected error.'}
            </div>
            <button
              onClick={() => this.setState({ error: null })}
              className="px-4 py-2 rounded-md text-xs font-medium bg-[#C9A24B] text-[#1A1712] hover:bg-[#DAB65E]"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
