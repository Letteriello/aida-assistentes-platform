/**
 * AIDA Platform - Accessibility Components Tests
 * Unit tests for accessibility components
 */

import React from 'react';
import { render, screen, waitFor } from '@/lib/test-utils';
import { axe } from 'jest-axe';
import { 
  SkipLinks, 
  ScreenReaderOnly, 
  LiveRegion, 
  FocusManager,
  AccessibleButton,
  AccessibleModal,
  AccessibleFormField,
  AccessibleProgress,
  AccessibleTabs
} from '../accessibility';

describe('Accessibility Components', () => {
  describe('SkipLinks', () => {
    it('renders skip links that are only visible on focus', () => {
      render(<SkipLinks />);
      
      const mainContentLink = screen.getByText('Pular para o conteúdo principal');
      const navigationLink = screen.getByText('Pular para a navegação');
      
      // Skip links should be visually hidden by default
      expect(mainContentLink.parentElement).toHaveClass('sr-only');
      expect(navigationLink.parentElement).toHaveClass('sr-only');
      
      // Skip links should have proper href attributes
      expect(mainContentLink).toHaveAttribute('href', '#main-content');
      expect(navigationLink).toHaveAttribute('href', '#navigation');
    });
    
    it('passes accessibility checks', async () => {
      const { container } = render(<SkipLinks />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
  
  describe('ScreenReaderOnly', () => {
    it('renders content that is only visible to screen readers', () => {
      render(<ScreenReaderOnly>Screen reader text</ScreenReaderOnly>);
      
      const element = screen.getByText('Screen reader text');
      expect(element).toHaveClass('sr-only');
    });
    
    it('passes accessibility checks', async () => {
      const { container } = render(<ScreenReaderOnly>Screen reader text</ScreenReaderOnly>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
  
  describe('LiveRegion', () => {
    it('renders with correct ARIA attributes', () => {
      render(
        <LiveRegion priority="assertive" atomic={true}>
          Important update
        </LiveRegion>
      );
      
      const liveRegion = screen.getByText('Important update');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
      expect(liveRegion).toHaveClass('sr-only');
    });
    
    it('passes accessibility checks', async () => {
      const { container } = render(
        <LiveRegion>Status update</LiveRegion>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
  
  describe('AccessibleButton', () => {
    it('renders with correct attributes', () => {
      render(<AccessibleButton>Click me</AccessibleButton>);
      
      const button = screen.getByRole('button', { name: 'Click me' });
      expect(button).toBeInTheDocument();
    });
    
    it('shows loading state correctly', () => {
      render(<AccessibleButton loading loadingText="Carregando...">Click me</AccessibleButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeDisabled();
      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });
    
    it('applies variant and size classes correctly', () => {
      render(
        <AccessibleButton variant="secondary" size="lg">
          Large Button
        </AccessibleButton>
      );
      
      const button = screen.getByRole('button', { name: 'Large Button' });
      expect(button).toHaveClass('bg-secondary');
      expect(button).toHaveClass('h-11');
    });
    
    it('passes accessibility checks', async () => {
      const { container } = render(<AccessibleButton>Accessible Button</AccessibleButton>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
  
  describe('AccessibleFormField', () => {
    it('renders label and input with correct associations', () => {
      render(
        <AccessibleFormField label="Email" required hint="Enter your email address" error="Invalid email">
          <input type="email" />
        </AccessibleFormField>
      );
      
      const label = screen.getByText('Email');
      expect(label).toBeInTheDocument();
      
      const requiredIndicator = screen.getByLabelText('obrigatório');
      expect(requiredIndicator).toBeInTheDocument();
      
      const hint = screen.getByText('Enter your email address');
      expect(hint).toBeInTheDocument();
      
      const error = screen.getByText('Invalid email');
      expect(error).toBeInTheDocument();
      expect(error).toHaveAttribute('role', 'alert');
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-required', 'true');
      
      // Check that input is associated with label, hint, and error
      const inputId = input.getAttribute('id');
      expect(label).toHaveAttribute('for', inputId);
      expect(hint).toHaveAttribute('id', `${inputId}-hint`);
      expect(error).toHaveAttribute('id', `${inputId}-error`);
      expect(input).toHaveAttribute('aria-describedby', `${inputId}-hint ${inputId}-error`);
    });
    
    it('passes accessibility checks', async () => {
      const { container } = render(
        <AccessibleFormField label="Name">
          <input type="text" />
        </AccessibleFormField>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
  
  describe('AccessibleProgress', () => {
    it('renders with correct ARIA attributes', () => {
      render(<AccessibleProgress value={50} max={100} label="Download Progress" />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
      expect(progressbar).toHaveAttribute('aria-label', 'Download Progress');
      
      const label = screen.getByText('Download Progress');
      expect(label).toBeInTheDocument();
    });
    
    it('passes accessibility checks', async () => {
      const { container } = render(<AccessibleProgress value={75} max={100} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
  
  describe('AccessibleTabs', () => {
    const tabs = [
      { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
      { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> }
    ];
    
    it('renders tabs with correct ARIA roles', () => {
      render(<AccessibleTabs tabs={tabs} />);
      
      // Check tablist
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
      
      // Check tabs
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      expect(tab1).toBeInTheDocument();
      expect(tab2).toBeInTheDocument();
      
      // Check tab panels
      const tabPanel1 = screen.getByRole('tabpanel');
      expect(tabPanel1).toBeInTheDocument();
      expect(tabPanel1).toHaveTextContent('Content 1');
      
      // Check ARIA attributes
      expect(tab1).toHaveAttribute('aria-selected', 'true');
      expect(tab2).toHaveAttribute('aria-selected', 'false');
      expect(tab1).toHaveAttribute('aria-controls', 'panel-tab1');
      expect(tabPanel1).toHaveAttribute('aria-labelledby', 'tab-tab1');
    });
    
    it('passes accessibility checks', async () => {
      const { container } = render(<AccessibleTabs tabs={tabs} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});