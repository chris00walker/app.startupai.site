import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive';
}

interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ 
  children, 
  className = '', 
  variant = 'default' 
}) => {
  const variantClasses = variant === 'destructive' 
    ? 'border-red-200 bg-red-50 text-red-800' 
    : 'border-blue-200 bg-blue-50 text-blue-800';
  
  return (
    <div className={`border rounded-lg p-4 ${variantClasses} ${className}`}>
      {children}
    </div>
  );
};

export const AlertDescription: React.FC<AlertDescriptionProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`text-sm ${className}`}>
      {children}
    </div>
  );
};
