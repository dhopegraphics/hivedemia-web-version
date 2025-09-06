import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = "Loading courses...",
}: LoadingStateProps) {
  return (
    <div className="text-center py-16">
      <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
      <p className="text-text-secondary">{message}</p>
    </div>
  );
}
