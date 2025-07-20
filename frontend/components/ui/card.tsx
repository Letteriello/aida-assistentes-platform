import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", size = "md", loading = false, interactive = false, children, ...props }, ref) => {
    const cardVariants = {
      default: "luxury-card rounded-organic border bg-card text-card-foreground shadow-soft",
      elevated: "luxury-card rounded-organic border bg-card text-card-foreground shadow-lg hover:shadow-xl",
      outlined: "luxury-card rounded-organic border-2 bg-transparent text-card-foreground shadow-none hover:shadow-soft",
      ghost: "luxury-card rounded-organic border-0 bg-transparent text-card-foreground shadow-none hover:bg-card/50"
    };

    const cardSizes = {
      sm: "p-4",
      md: "p-6",
      lg: "p-8"
    };

    const interactiveClasses = interactive 
      ? "cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-elegant active:scale-[0.98]"
      : "";

    return (
      <div
        ref={ref}
        className={cn(
          cardVariants[variant],
          cardSizes[size],
          interactiveClasses,
          "animate-liquid-rise transition-all duration-300 relative overflow-hidden",
          loading && "pointer-events-none",
          className
        )}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "compact" | "spacious";
  align?: "left" | "center" | "right";
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, variant = "default", align = "left", ...props }, ref) => {
    const headerVariants = {
      default: "flex flex-col space-y-2 p-6",
      compact: "flex flex-col space-y-1 p-4",
      spacious: "flex flex-col space-y-4 p-8"
    };

    const alignClasses = {
      left: "text-left",
      center: "text-center items-center",
      right: "text-right items-end"
    };

    return (
      <div
        ref={ref}
        className={cn(
          headerVariants[variant],
          alignClasses[align],
          "border-b border-border/50 last:border-b-0",
          className
        )}
        {...props}
      />
    );
  }
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-none tracking-tight text-flow",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "compact" | "spacious" | "flush";
  scrollable?: boolean;
  maxHeight?: string;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, variant = "default", scrollable = false, maxHeight, ...props }, ref) => {
    const contentVariants = {
      default: "p-6 pt-0",
      compact: "p-4 pt-0",
      spacious: "p-8 pt-0",
      flush: "p-0"
    };

    const scrollableClasses = scrollable 
      ? "overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
      : "";

    return (
      <div
        ref={ref}
        className={cn(
          contentVariants[variant],
          scrollableClasses,
          "flex-1",
          className
        )}
        style={maxHeight ? { maxHeight } : undefined}
        {...props}
      />
    );
  }
);
CardContent.displayName = "CardContent";

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "compact" | "spacious";
  justify?: "start" | "center" | "end" | "between" | "around";
  direction?: "row" | "column";
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, variant = "default", justify = "start", direction = "row", ...props }, ref) => {
    const footerVariants = {
      default: "p-6 pt-0",
      compact: "p-4 pt-0",
      spacious: "p-8 pt-0"
    };

    const justifyClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around"
    };

    const directionClasses = {
      row: "flex-row items-center",
      column: "flex-col items-stretch space-y-2"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex",
          footerVariants[variant],
          justifyClasses[justify],
          directionClasses[direction],
          "border-t border-border/50 first:border-t-0",
          className
        )}
        {...props}
      />
    );
  }
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };