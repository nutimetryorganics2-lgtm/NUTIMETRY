import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("PRODUCTION_UI_CRASH:", error, errorInfo);
    // Here you would typically log to Sentry or similar
    if (window.Sentry) {
      window.Sentry.captureException(error, { extra: errorInfo });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9F7F2] p-8 text-center">
          <div className="max-w-xl w-full bg-white p-12 rounded-[3rem] shadow-2xl border border-red-50">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <h1 className="text-4xl font-serif font-bold text-primary mb-4">Portal Synchronization Interrupted</h1>
            <p className="text-gray-500 mb-10 leading-relaxed">
              Our biotech network encountered a runtime exception. This usually happens during high-load data synchronization.
            </p>
            
            {import.meta.env.DEV && (
              <div className="mb-10 p-6 bg-slate-50 rounded-2xl text-left overflow-auto max-h-60 border border-slate-100 font-mono text-xs">
                <p className="text-red-600 font-bold mb-2">Error: {this.state.error?.message}</p>
                <pre className="text-slate-500 whitespace-pre-wrap">{this.state.error?.stack}</pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="px-10 py-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all"
              >
                Reload Portal
              </button>
              <button 
                onClick={() => window.location.href = '/'} 
                className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
              >
                Back to Safety
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
