"use client";

import * as React from "react";
import { Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkPasswordBreach } from "@/lib/utils/password-validation";

interface PasswordRequirement {
  text: string;
  isValid: boolean;
  isLoading?: boolean;
}

interface EnhancedPasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showToggle?: boolean;
  showRequirements?: boolean;
  label?: string;
  onBreachStatusChange?: (isBreached: boolean) => void;
}

const EnhancedPasswordInput = React.forwardRef<
  HTMLInputElement,
  EnhancedPasswordInputProps
>(({ className, showToggle = true, showRequirements = false, label, onBreachStatusChange, ...props }, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isBreachChecking, setIsBreachChecking] = React.useState(false);
  const [isBreached, setIsBreached] = React.useState<boolean | null>(null);
  const [debounceTimer, setDebounceTimer] = React.useState<NodeJS.Timeout | null>(null);
  const password = (props.value as string) || "";

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Debounced breach check
  React.useEffect(() => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Only check if password meets basic requirements and has content
    if (password.length >= 6 && /\d/.test(password) && /[a-zA-Z]/.test(password) && /[A-Z]/.test(password)) {
      setIsBreachChecking(true);
      setIsBreached(null);

      const timer = setTimeout(async () => {
        try {
          const result = await checkPasswordBreach(password);
          setIsBreached(result.isBreached);
          setIsBreachChecking(false);
          
          // Notify parent component of breach status
          if (onBreachStatusChange) {
            onBreachStatusChange(result.isBreached);
          }
        } catch (error) {
          console.error('Breach check failed:', error);
          setIsBreached(false); // Assume safe if check fails
          setIsBreachChecking(false);
          
          if (onBreachStatusChange) {
            onBreachStatusChange(false);
          }
        }
      }, 3000); // 3 second delay

      setDebounceTimer(timer);
    } else {
      // Reset breach status if password doesn't meet basic requirements
      setIsBreached(null);
      setIsBreachChecking(false);
      if (onBreachStatusChange) {
        onBreachStatusChange(false);
      }
    }

    // Cleanup function
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [password, onBreachStatusChange]);

  const requirements: PasswordRequirement[] = [
    {
      text: "At least 6 characters",
      isValid: password.length >= 6,
    },
    {
      text: "Contains numbers",
      isValid: /\d/.test(password),
    },
    {
      text: "Contains letters",
      isValid: /[a-zA-Z]/.test(password),
    },
    {
      text: "Contains uppercase letters",
      isValid: /[A-Z]/.test(password),
    },
    {
      text: "Not found in data breaches",
      isValid: isBreached === false,
      isLoading: isBreachChecking,
    },
  ];

  const shouldShowRequirements = showRequirements && (password.length > 0 || isFocused);

  return (
    <div className="relative space-y-2 z-10">
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {showToggle && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={togglePasswordVisibility}
            disabled={props.disabled}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="sr-only">
              {showPassword ? "Hide password" : "Show password"}
            </span>
          </Button>
        )}
      </div>
      
      {/* Animated Requirements Dropdown */}
      <div
        className={cn(
          "overflow-visible transition-all duration-300 ease-in-out",
          shouldShowRequirements
            ? "max-h-40 opacity-100 transform translate-y-0"
            : "max-h-0 opacity-0 transform -translate-y-2"
        )}
      >
        <div className="bg-neutral-800 rounded-lg p-3 border border-neutral-700 mt-1 shadow-lg z-20 relative">
          <p className="text-sm font-medium text-neutral-300 mb-2">
            Password requirements:
          </p>
          <ul className="space-y-1">
            {requirements.map((requirement, index) => (
              <li key={index} className="flex items-center space-x-2 text-sm">
                <div
                  className={cn(
                    "transition-colors duration-200",
                    requirement.isLoading
                      ? "text-blue-500"
                      : requirement.isValid
                      ? "text-green-500"
                      : "text-red-500"
                  )}
                >
                  {requirement.isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : requirement.isValid ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}
                </div>
                <span
                  className={cn(
                    "transition-colors duration-200",
                    requirement.isLoading
                      ? "text-blue-400"
                      : requirement.isValid
                      ? "text-green-400"
                      : "text-red-400"
                  )}
                >
                  {requirement.text}
                  {requirement.isLoading && " (checking...)"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
});

EnhancedPasswordInput.displayName = "EnhancedPasswordInput";

export { EnhancedPasswordInput };