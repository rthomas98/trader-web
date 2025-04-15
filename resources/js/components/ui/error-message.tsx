import React from 'react';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  children: React.ReactNode;
  className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={cn(
      "flex items-center justify-center p-4 rounded-md",
      "text-red-500 dark:text-red-400",
      "border border-red-300 dark:border-red-700",
      className
    )}>
      {children}
    </div>
  );
};

export default ErrorMessage;
