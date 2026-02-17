import { useEffect } from 'react';

interface PageTransitionContentProps {
  children: React.ReactNode;
  onReady: () => void;
}

// This component calls onReady as soon as it is mounted (i.e., Suspense has resolved)
const PageTransitionContent: React.FC<PageTransitionContentProps> = ({ children, onReady }) => {
  useEffect(() => {
    onReady();
    // Only call on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <>{children}</>;
};

export default PageTransitionContent;