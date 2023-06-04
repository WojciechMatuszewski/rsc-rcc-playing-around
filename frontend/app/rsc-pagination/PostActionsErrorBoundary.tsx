"use client";

import { ErrorBoundary } from "react-error-boundary";

export const PostActionsErrorBoundary = ({
  children
}: {
  children: React.ReactNode;
}) => {
  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }: any) => {
        return (
          <div className="flex gap-2 flex-col">
            <span className="text-red-500">Something went wrong</span>
            <button
              className="px-2 py-1 bg-red-200 rounded"
              type="button"
              onClick={resetErrorBoundary}
            >
              Reset
            </button>
          </div>
        );
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
