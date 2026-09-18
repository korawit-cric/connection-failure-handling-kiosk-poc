'use client';

import { forwardRef, ReactNode } from 'react';
import { ArrowRight } from '@repo/icons';
import { cn } from './utils';

type ButtonSize = 'large' | 'small';
type ButtonVariant =
  | 'primary'
  | 'primary-icon'
  | 'secondary'
  | 'linked'
  | 'textlink';
type ButtonColor = 'primary' | 'yellow' | 'red';

/**
 * Button Component
 *
 * @example
 * <Button variant="primary">Click me</Button>
 * <Button variant="primary-icon" icon={<Icon />}>Text</Button>
 * <Button variant="secondary" color="primary">Text</Button>
 * <Button variant="primary" color="yellow" size="small">Text</Button>
 * <Button variant="linked" href="/page">Text</Button>
 * <Button variant="textlink" href="/page">Text</Button>
 * <Button variant="primary" disabled>Text</Button>
 *
 * @example With Next.js Link
 * ```tsx
 * import Link from 'next/link';
 * import { Button } from '@repo/ui/button';
 *
 * <Button variant="linked" href="/page" as={Link}>
 *   Go to Page
 * </Button>
 * ```
 */
export interface ButtonProps {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  /**
   * Optional component to render instead of <a> for links
   * Useful for Next.js Link: as={Link}
   * @example
   * ```tsx
   * import Link from 'next/link';
   * <Button variant="linked" href="/page" as={Link}>Go to Page</Button>
   * ```
   */
  as?: React.ComponentType<React.AnchorHTMLAttributes<HTMLAnchorElement>>;
}

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'large',
      color = 'primary',
      icon,
      onClick,
      disabled = false,
      href,
      type = 'button',
      as: LinkComponent,
    },
    ref,
  ) => {
    // Size styles
    // NOTE: Custom text utilities (text-desktop-body1, text-desktop-body2) are preserved
    // by tailwind-merge because they're registered in utils.ts configuration
    const sizeStyles = {
      large: 'h-14 md:h-12 text-mobile-body1 md:text-desktop-body1',
      small: 'h-10 md:h-10 text-mobile-body2 md:text-desktop-body2',
    };

    // Base styles
    const baseStyles = cn(
      'inline-flex items-center justify-center gap-2 px-4 py-[9px] rounded-lg font-medium transition-all duration-200 cursor-pointer',
      sizeStyles[size],
    );

    // Color mappings
    const colorStyles = {
      primary: {
        bg: 'bg-primary-600',
        border: 'border-primary-700',
        bgHover: 'hover:bg-primary-700',
        borderHover: 'hover:border-primary-800',
        borderWidth: 'border',
        text: 'text-white',
        textLink: 'text-primary-600',
        textLinkHover: 'hover:text-primary-700',
      },
      yellow: {
        bg: 'bg-warning-300',
        border: 'border-warning-800',
        bgHover: 'hover:bg-warning-500',
        borderHover: 'hover:border-warning-800',
        borderWidth: 'border-2',
        text: 'text-darkest-gray',
        textLink: 'text-warning-500',
        textLinkHover: 'hover:text-warning-800',
      },
      red: {
        bg: 'bg-error-300',
        border: 'border-error-500',
        bgHover: 'hover:bg-error-500',
        borderHover: 'hover:border-error-800',
        borderWidth: 'border-2',
        text: 'text-white',
        textLink: 'text-error-300',
        textLinkHover: 'hover:text-error-500',
      },
    };

    const colors = colorStyles[color];

    // Disabled styles override
    const disabledColorStyles = disabled
      ? 'bg-gray border-medium-gray border text-medium-gray hover:bg-gray hover:border-medium-gray cursor-not-allowed'
      : '';

    // Variant styles
    const variantStyles: Record<ButtonVariant, string> = {
      primary: disabled
        ? disabledColorStyles
        : cn(
            colors.bg,
            colors.bgHover,
            colors.text,
            colors.border,
            colors.borderHover,
            colors.borderWidth,
          ),
      'primary-icon': disabled
        ? disabledColorStyles
        : cn(
            colors.bg,
            colors.bgHover,
            colors.text,
            colors.border,
            colors.borderHover,
            colors.borderWidth,
          ),
      secondary: disabled
        ? cn(
            disabledColorStyles,
            'bg-transparent hover:bg-transparent border-none ',
          )
        : cn(
            'bg-transparent border-none',
            colors.border,
            colors.borderHover,
            colors.borderWidth,
            colors.textLink,
            colors.textLinkHover,
          ),
      linked: disabled
        ? cn(
            disabledColorStyles,
            'bg-transparent hover:bg-transparent border-none ',
          )
        : cn('bg-transparent ', colors.textLink, colors.textLinkHover),
      textlink: disabled
        ? cn(
            disabledColorStyles,
            'bg-transparent hover:bg-transparent border-none underline ',
          )
        : cn('bg-transparent underline', colors.textLink, colors.textLinkHover),
    };

    const content = (
      <>
        {variant === 'primary-icon' && icon && <span>{icon}</span>}
        {children}
        {variant === 'linked' && (
          <span>
            <ArrowRight className="h-5" />
          </span>
        )}
      </>
    );

    // For textlink and linked, render as anchor if href is provided
    if ((variant === 'textlink' || variant === 'linked') && href && !disabled) {
      const LinkElement = LinkComponent || 'a';
      return (
        <LinkElement
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          href={href}
          className={cn(baseStyles, variantStyles[variant], className)}
        >
          {content}
        </LinkElement>
      );
    }

    return (
      <button
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        type={type}
        className={cn(baseStyles, variantStyles[variant], className)}
        onClick={onClick}
        disabled={disabled}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = 'Button';
