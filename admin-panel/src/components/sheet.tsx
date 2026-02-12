'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SheetContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export const Sheet = ({ 
  children, 
  open, 
  onOpenChange 
}: { 
  children: React.ReactNode, 
  open?: boolean, 
  onOpenChange?: (open: boolean) => void 
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;
  const setIsOpen = isControlled ? onOpenChange : setUncontrolledOpen;

  // Prevent scrolling when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <SheetContext.Provider value={{ open: !!isOpen, setOpen: setIsOpen! }}>
      {children}
    </SheetContext.Provider>
  );
};

export const SheetTrigger = ({ asChild, children }: { asChild?: boolean, children: React.ReactNode }) => {
  const context = React.useContext(SheetContext);
  if (!context) throw new Error("SheetTrigger used outside Sheet");

  const child = asChild ? React.Children.only(children) as React.ReactElement : null;
  
  if (child) {
    return React.cloneElement(child as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
        // @ts-ignore
        child.props.onClick?.(e);
        context.setOpen(true);
      }
    });
  }

  return (
    <button onClick={() => context.setOpen(true)}>{children}</button>
  );
};

export const SheetContent = ({ 
  side = "right", 
  className, 
  children 
}: { 
  side?: "left" | "right", 
  className?: string, 
  children: React.ReactNode 
}) => {
  const context = React.useContext(SheetContext);
  if (!context) throw new Error("SheetContent used outside Sheet");

  if (!context.open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={() => context.setOpen(false)}
      />
      
      {/* Content */}
      <div className={cn(
        "fixed z-[101] bg-white p-6 shadow-xl transition ease-in-out animate-in duration-300 slide-in-from-left h-full dark:bg-zinc-950 flex flex-col",
        side === "left" ? "inset-y-0 left-0 border-r border-zinc-200 dark:border-zinc-800" : "inset-y-0 right-0 border-l border-zinc-200 dark:border-zinc-800",
        className
      )}>
        <button 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-zinc-100 dark:ring-offset-zinc-950 dark:focus:ring-zinc-300 dark:data-[state=open]:bg-zinc-800"
          onClick={() => context.setOpen(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  );
};
