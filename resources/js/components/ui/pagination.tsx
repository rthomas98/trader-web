import * as React from "react"
import { Link } from '@inertiajs/react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Base interface for common Link properties
interface PaginationLinkProps {
  href: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface PaginationProps extends React.ComponentProps<'nav'> {
  children: React.ReactNode;
}

interface PaginationItemProps extends PaginationLinkProps {
  active?: boolean;
}

const Pagination = ({ className, children, ...props }: PaginationProps) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  >
    <ul className="flex flex-row items-center gap-1">
      {children}
    </ul>
  </nav>
);

const PaginationItem = React.forwardRef<HTMLLIElement, PaginationItemProps>(
  ({ className, active, disabled, href, children, ...rest }, ref) => (
    <li ref={ref} className={cn("", className)}>
      <Button
        asChild
        variant={active ? "default" : "outline"}
        size={'icon'}
        className={cn(
          "h-9 w-9",
          {
            "pointer-events-none opacity-50": disabled,
            "bg-primary text-primary-foreground": active,
          },
          className
        )}
      >
        {href && !disabled ? (
          <Link href={href} {...rest}>{children}</Link>
        ) : (
          <span>{children}</span>
        )}
      </Button>
    </li>
  )
)
PaginationItem.displayName = "PaginationItem"

type PaginationPreviousProps = PaginationLinkProps;

const PaginationPrevious = React.forwardRef<HTMLLIElement, PaginationPreviousProps>(
  ({ className, href, disabled, ...rest }, ref) => (
    <li ref={ref} className={cn("mr-auto", className)}>
      <Button
        asChild
        variant="outline"
        size={'icon'}
        className={cn("h-9 w-9", {
          "pointer-events-none opacity-50": disabled,
        }, className)}
      >
        {href && !disabled ? (
          <Link href={href} {...rest}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </Link>
        ) : (
          <span>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous page</span>
          </span>
        )}
      </Button>
    </li>
  )
)
PaginationPrevious.displayName = "PaginationPrevious"

type PaginationNextProps = PaginationLinkProps;

const PaginationNext = React.forwardRef<HTMLLIElement, PaginationNextProps>(
  ({ className, href, disabled, ...rest }, ref) => (
    <li ref={ref} className={cn("ml-auto", className)}>
      <Button
        asChild
        variant="outline"
        size={'icon'}
        className={cn("h-9 w-9", {
          "pointer-events-none opacity-50": disabled,
        }, className)}
      >
        {href && !disabled ? (
          <Link href={href} {...rest}>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </Link>
        ) : (
          <span>
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next page</span>
          </span>
        )}
      </Button>
    </li>
  )
)
PaginationNext.displayName = "PaginationNext"

type PaginationFirstProps = PaginationLinkProps;

const PaginationFirst = React.forwardRef<HTMLLIElement, PaginationFirstProps>(
  ({ className, href, disabled, ...rest }, ref) => (
    <li ref={ref} className={cn("mr-auto", className)}>
      <Button
        asChild
        variant="outline"
        size={'icon'}
        className={cn("h-9 w-9", {
          "pointer-events-none opacity-50": disabled,
        }, className)}
      >
        {href && !disabled ? (
          <Link href={href} {...rest}>
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </Link>
        ) : (
          <span>
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">First page</span>
          </span>
        )}
      </Button>
    </li>
  )
)
PaginationFirst.displayName = "PaginationFirst"

type PaginationLastProps = PaginationLinkProps;

const PaginationLast = React.forwardRef<HTMLLIElement, PaginationLastProps>(
  ({ className, href, disabled, ...rest }, ref) => (
    <li ref={ref} className={cn("ml-auto", className)}>
      <Button
        asChild
        variant="outline"
        size={'icon'}
        className={cn("h-9 w-9", {
          "pointer-events-none opacity-50": disabled,
        }, className)}
      >
        {href && !disabled ? (
          <Link href={href} {...rest}>
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </Link>
        ) : (
          <span>
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Last page</span>
          </span>
        )}
      </Button>
    </li>
  )
)
PaginationLast.displayName = "PaginationLast"

Pagination.Item = PaginationItem;
Pagination.Previous = PaginationPrevious;
Pagination.Next = PaginationNext;
Pagination.First = PaginationFirst;
Pagination.Last = PaginationLast;

export { Pagination };
