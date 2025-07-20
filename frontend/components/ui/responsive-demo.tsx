/**
 * AIDA Platform - Responsive Design Demo
 * Demonstrates responsive design patterns and container queries
 */

'use client';

import React from 'react';
import { 
  ResponsiveContainer, 
  ResponsiveGrid, 
  ResponsiveSplit, 
  ResponsiveText,
  ResponsiveSpacer
} from './responsive-container';
import { 
  ContainerAdaptiveCard, 
  ContainerAdaptiveGrid, 
  ContainerAdaptiveLayout,
  ContainerAdaptiveDataDisplay
} from './container-adaptive';
import { MobileNavigation, BottomSheet } from './mobile-navigation';
import { TouchButton, TouchSlider, TouchSegmentedControl } from './touch-optimized';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { 
  LayoutGrid, 
  Smartphone, 
  Tablet, 
  Monitor, 
  Laptop,
  Users,
  MessageSquare,
  Bot,
  Activity,
  Database,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Responsive Design Demo Component
export function ResponsiveDesignDemo() {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = React.useState(false);
  const [sliderValue, setSliderValue] = React.useState(50);
  const [segmentValue, setSegmentValue] = React.useState('desktop');

  return (
    <div className="space-y-12 pb-20 md:pb-10">
      {/* Responsive Typography Section */}
      <section>
        <ResponsiveContainer maxWidth="xl" padding="lg">
          <ResponsiveText as="h2" size="2xl" weight="semibold" className="mb-4">
            Responsive Typography
          </ResponsiveText>
          
          <ResponsiveText className="text-muted-foreground mb-6">
            Text that automatically adjusts its size based on the viewport width.
          </ResponsiveText>
          
          <ResponsiveGrid cols={{ xs: 1, md: 2 }} gap="lg">
            <Card>
              <CardHeader>
                <CardTitle>Responsive Headings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ResponsiveText as="h1" size="4xl" weight="bold">
                  Heading 1
                </ResponsiveText>
                <ResponsiveText as="h2" size="3xl" weight="semibold">
                  Heading 2
                </ResponsiveText>
                <ResponsiveText as="h3" size="2xl" weight="medium">
                  Heading 3
                </ResponsiveText>
                <ResponsiveText as="h4" size="xl" weight="medium">
                  Heading 4
                </ResponsiveText>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Responsive Body Text</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ResponsiveText size="lg">
                  Large body text that adjusts based on screen size. This text will be larger on desktop devices and smaller on mobile devices.
                </ResponsiveText>
                <ResponsiveText>
                  Standard body text with default size. This maintains readability across all device sizes while adjusting slightly for optimal reading experience.
                </ResponsiveText>
                <ResponsiveText size="sm">
                  Smaller text for less important information. This text will remain legible even on small screens while taking up less space.
                </ResponsiveText>
              </CardContent>
            </Card>
          </ResponsiveGrid>
        </ResponsiveContainer>
      </section>
      
      {/* Responsive Layouts Section */}
      <section className="bg-muted/30 py-8">
        <ResponsiveContainer maxWidth="xl" padding="lg">
          <ResponsiveText as="h2" size="2xl" weight="semibold" className="mb-4">
            Responsive Layouts
          </ResponsiveText>
          
          <ResponsiveText className="text-muted-foreground mb-6">
            Layout components that adapt to different screen sizes.
          </ResponsiveText>
          
          <ResponsiveSplit>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Sidebar Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This sidebar will stack above the main content on mobile devices and appear side-by-side on larger screens.
                </p>
                <ResponsiveSpacer size="md" />
                <div className="space-y-2">
                  {['Dashboard', 'Analytics', 'Settings', 'Profile'].map((item) => (
                    <div 
                      key={item} 
                      className="p-2 bg-background rounded-md border cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Main Content</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  This is the main content area that will take up more space on the screen. The layout will automatically adjust based on the screen size.
                </p>
                
                <ResponsiveGrid cols={{ xs: 1, sm: 2, lg: 3 }} gap="md" className="mb-4">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div 
                      key={item} 
                      className="p-4 bg-background rounded-md border flex items-center justify-center h-20"
                    >
                      Item {item}
                    </div>
                  ))}
                </ResponsiveGrid>
                
                <Button>Action Button</Button>
              </CardContent>
            </Card>
          </ResponsiveSplit>
        </ResponsiveContainer>
      </section>
      
      {/* Container Queries Section */}
      <section>
        <ResponsiveContainer maxWidth="xl" padding="lg">
          <ResponsiveText as="h2" size="2xl" weight="semibold" className="mb-4">
            Container Queries
          </ResponsiveText>
          
          <ResponsiveText className="text-muted-foreground mb-6">
            Components that adapt based on their container size, not just the viewport.
          </ResponsiveText>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ContainerAdaptiveCard
                title="Container-Based Responsive Card"
                description="This card adapts its layout based on its container width"
                icon={<LayoutGrid className="h-5 w-5" />}
                content={
                  <ContainerAdaptiveDataDisplay
                    items={[
                      { label: 'Users', value: '1,234', icon: <Users className="h-4 w-4" /> },
                      { label: 'Messages', value: '5,678', icon: <MessageSquare className="h-4 w-4" /> },
                      { label: 'Assistants', value: '12', icon: <Bot className="h-4 w-4" /> },
                      { label: 'Active', value: '8', icon: <Activity className="h-4 w-4" /> }
                    ]}
                  />
                }
                footer={
                  <div className="flex flex-col @sm:flex-row @sm:justify-between w-full gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    <Button size="sm">Take Action</Button>
                  </div>
                }
              />
            </div>
            
            <div>
              <ContainerAdaptiveCard
                title="Smaller Container"
                description="Notice how this adapts differently"
                icon={<Database className="h-5 w-5" />}
                content={
                  <ContainerAdaptiveDataDisplay
                    items={[
                      { label: 'Storage', value: '45%', icon: <Database className="h-4 w-4" /> },
                      { label: 'Performance', value: '92%', icon: <BarChart3 className="h-4 w-4" /> }
                    ]}
                  />
                }
                footer={
                  <Button variant="outline" size="sm" className="w-full">View Details</Button>
                }
              />
            </div>
          </div>
          
          <ResponsiveSpacer size="lg" />
          
          <ContainerAdaptiveGrid>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Card key={item} className="@container">
                <CardHeader className="@md:flex-row @md:items-center @md:justify-between">
                  <CardTitle className="@sm:text-lg">Item {item}</CardTitle>
                  <div className="hidden @md:flex items-center space-x-2">
                    <Button variant="outline" size="sm">Action</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground @md:text-base">
                    This card adapts based on its own container width, not the viewport.
                  </p>
                  <div className="flex items-center justify-center @md:justify-start mt-4 space-x-2">
                    <Button variant="outline" size="sm" className="@md:hidden">Action</Button>
                    <Button size="sm">View</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </ContainerAdaptiveGrid>
        </ResponsiveContainer>
      </section>
      
      {/* Mobile Optimizations Section */}
      <section className="bg-muted/30 py-8">
        <ResponsiveContainer maxWidth="xl" padding="lg">
          <ResponsiveText as="h2" size="2xl" weight="semibold" className="mb-4">
            Mobile Optimizations
          </ResponsiveText>
          
          <ResponsiveText className="text-muted-foreground mb-6">
            Touch-friendly components optimized for mobile devices.
          </ResponsiveText>
          
          <ResponsiveGrid cols={{ xs: 1, md: 2 }} gap="lg">
            <Card>
              <CardHeader>
                <CardTitle>Touch-Optimized Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Touch-Friendly Slider</label>
                  <TouchSlider
                    min={0}
                    max={100}
                    value={sliderValue}
                    onChange={setSliderValue}
                    thumbSize="lg"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Segmented Control</label>
                  <TouchSegmentedControl
                    options={[
                      { value: 'mobile', label: 'Mobile', icon: <Smartphone className="h-4 w-4" /> },
                      { value: 'tablet', label: 'Tablet', icon: <Tablet className="h-4 w-4" /> },
                      { value: 'desktop', label: 'Desktop', icon: <Monitor className="h-4 w-4" /> },
                      { value: 'laptop', label: 'Laptop', icon: <Laptop className="h-4 w-4" /> }
                    ]}
                    value={segmentValue}
                    onChange={setSegmentValue}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Touch-Friendly Buttons</label>
                  <div className="flex flex-wrap gap-2">
                    <TouchButton>Primary</TouchButton>
                    <TouchButton variant="outline">Secondary</TouchButton>
                    <TouchButton variant="destructive">Delete</TouchButton>
                  </div>
                </div>
                
                <div>
                  <TouchButton 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsBottomSheetOpen(true)}
                  >
                    Open Bottom Sheet
                  </TouchButton>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Mobile Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Mobile-optimized navigation with bottom bar and slide-out drawer.
                </p>
                
                <div className="border rounded-lg overflow-hidden bg-background p-4 h-[400px] relative">
                  <div className="text-center text-muted-foreground mb-4">
                    Mobile Navigation Preview
                  </div>
                  
                  <div className="absolute bottom-0 left-0 right-0">
                    <MobileNavigation />
                  </div>
                </div>
              </CardContent>
            </Card>
          </ResponsiveGrid>
        </ResponsiveContainer>
      </section>
      
      {/* Bottom Sheet Demo */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        title="Bottom Sheet Example"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This is a mobile-optimized bottom sheet component. It's designed for touch interactions and includes swipe-to-dismiss functionality.
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            {['Option 1', 'Option 2', 'Option 3', 'Option 4'].map((option) => (
              <TouchButton 
                key={option} 
                variant="outline"
                onClick={() => setIsBottomSheetOpen(false)}
              >
                {option}
              </TouchButton>
            ))}
          </div>
          
          <TouchButton 
            className="w-full"
            onClick={() => setIsBottomSheetOpen(false)}
          >
            Confirm Selection
          </TouchButton>
        </div>
      </BottomSheet>
    </div>
  );
}