import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              ⚠️ 오류가 발생했습니다
            </h1>
            <p className="text-gray-700 mb-4">
              게임을 로드하는 중에 문제가 발생했습니다. 
              페이지를 새로고침하여 다시 시도해주세요.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-600">
                  오류 세부사항 (개발 모드)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <button
              onClick={this.handleReload}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            >
              페이지 새로고침
            </button>
            
            <p className="text-xs text-gray-500 mt-4 text-center">
              문제가 계속되면 관리자에게 문의하세요.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}