/**
 * AIDA Platform - Compound Components
 * Advanced component composition patterns for flexible UI building
 */

'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, X, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Card, CardContent } from './card';

// === ACCORDION COMPOUND COMPONENT ===

interface AccordionContextType {
  openItems: string[];
  toggleItem: (value: string) => void;
  multiple?: boolean;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

interface AccordionProps {
  children: React.ReactNode;
  multiple?: boolean;
  defaultValue?: string | string[];
  className?: string;
}

export function Accordion({ children, multiple = false, defaultValue, className }: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return [];
  });

  const toggleItem = (value: string) => {
    setOpenItems(prev => {
      if (multiple) {
        return prev.includes(value) 
          ? prev.filter(item => item !== value)
          : [...prev, value];
      } else {
        return prev.includes(value) ? [] : [value];
      }
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, multiple }}>
      <div className={cn('space-y-2', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

function AccordionItem({ children, value, className }: AccordionItemProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionItem must be used within Accordion');

  const isOpen = context.openItems.includes(value);

  return (
    <div className={cn('border rounded-lg overflow-hidden', className)}>
      {React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child, { value, isOpen, ...context } as any)
          : child
      )}
    </div>
  );
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  value?: string;
  isOpen?: boolean;
  toggleItem?: (value: string) => void;
  className?: string;
}

function AccordionTrigger({ children, value, isOpen, toggleItem, className }: AccordionTriggerProps) {
  return (
    <button
      className={cn(
        'flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 transition-colors',
        className
      )}
      onClick={() => value && toggleItem?.(value)}
    >
      <span className="font-medium">{children}</span>
      <motion.div
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronRight className="h-4 w-4" />
      </motion.div>
    </button>
  );
}

interface AccordionContentProps {
  children: React.ReactNode;
  isOpen?: boolean;
  className?: string;
}

function AccordionContent({ children, isOpen, className }: AccordionContentProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="overflow-hidden"
        >
          <div className={cn('p-4 pt-0 text-sm text-muted-foreground', className)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Attach compound components
Accordion.Item = AccordionItem;
Accordion.Trigger = AccordionTrigger;
Accordion.Content = AccordionContent;

// === TABS COMPOUND COMPONENT ===

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

interface TabsProps {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function Tabs({ children, defaultValue, className, orientation = 'horizontal' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn(
        'space-y-4',
        orientation === 'vertical' && 'flex space-y-0 space-x-4',
        className
      )}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

function TabsTrigger({ children, value, className }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const isActive = context.activeTab === value;

  return (
    <motion.button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive && 'bg-background text-foreground shadow-sm',
        className
      )}
      onClick={() => context.setActiveTab(value)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.button>
  );
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

function TabsContent({ children, value, className }: TabsContentProps) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  const isActive = context.activeTab === value;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Content = TabsContent;

// === MODAL COMPOUND COMPONENT ===

interface ModalContextType {
  isOpen: boolean;
  onClose: () => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export function Modal({ children, isOpen, onClose }: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <ModalContext.Provider value={{ isOpen, onClose }}>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            
            {/* Modal Container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

function ModalContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn('w-full max-w-lg max-h-[90vh] overflow-auto', className)}>
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  );
}

function ModalHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  const context = useContext(ModalContext);
  
  return (
    <div className={cn('flex items-center justify-between p-6 border-b', className)}>
      <div className="flex-1">
        {children}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={context?.onClose}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  );
}

function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-end space-x-2 p-6 border-t', className)}>
      {children}
    </div>
  );
}

Modal.Content = ModalContent;
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

// === FORM COMPOUND COMPONENT ===

interface FormContextType {
  errors: Record<string, string>;
  values: Record<string, any>;
  setFieldValue: (name: string, value: any) => void;
  setFieldError: (name: string, error: string) => void;
  clearFieldError: (name: string) => void;
}

const FormContext = createContext<FormContextType | null>(null);

interface FormProps {
  children: React.ReactNode;
  onSubmit: (values: Record<string, any>) => void;
  initialValues?: Record<string, any>;
  className?: string;
}

export function Form({ children, onSubmit, initialValues = {}, className }: FormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setFieldValue = (name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      clearFieldError(name);
    }
  };

  const setFieldError = (name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const clearFieldError = (name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <FormContext.Provider value={{ errors, values, setFieldValue, setFieldError, clearFieldError }}>
      <form onSubmit={handleSubmit} className={className}>
        {children}
      </form>
    </FormContext.Provider>
  );
}

interface FormFieldProps {
  children: React.ReactNode;
  name: string;
  className?: string;
}

function FormField({ children, name, className }: FormFieldProps) {
  const context = useContext(FormContext);
  if (!context) throw new Error('FormField must be used within Form');

  const hasError = !!context.errors[name];

  return (
    <div className={cn('space-y-2', className)}>
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child, { 
              name, 
              value: context.values[name] || '',
              onChange: (e: any) => context.setFieldValue(name, e.target.value),
              hasError,
              error: context.errors[name],
              ...child.props
            } as any)
          : child
      )}
    </div>
  );
}

function FormLabel({ children, required, className }: { 
  children: React.ReactNode; 
  required?: boolean;
  className?: string;
}) {
  return (
    <label className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)}>
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  );
}

function FormError({ error, className }: { error?: string; className?: string }) {
  if (!error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn('flex items-center space-x-1 text-sm text-destructive', className)}
    >
      <AlertCircle className="h-3 w-3" />
      <span>{error}</span>
    </motion.div>
  );
}

function FormSuccess({ message, className }: { message?: string; className?: string }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn('flex items-center space-x-1 text-sm text-green-600', className)}
    >
      <Check className="h-3 w-3" />
      <span>{message}</span>
    </motion.div>
  );
}

Form.Field = FormField;
Form.Label = FormLabel;
Form.Error = FormError;
Form.Success = FormSuccess;