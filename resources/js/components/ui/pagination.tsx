import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PaginationProps extends React.ComponentProps<'nav'> {
  children: React.ReactNode;
}

interface PaginationItemProps extends React.ComponentProps<typeof Link> {
  active?: boolean;
  disabled?: boolean;
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

const PaginationItem = ({ className, active, disabled, ...props }: PaginationItemProps) => (
  <li>
    <Button
      asChild
      variant={active ? "default" : "outline"}
      size="icon"
      className={cn(
        "h-9 w-9",
        {
          "pointer-events-none opacity-50": disabled,
          "bg-primary text-primary-foreground": active,
        },
        className
      )}
      {...props}
    >
      {props.href && !disabled ? (
        <Link {...props} />
      ) : (
        <span {...props} />
      )}
    </Button>
  </li>
);

const PaginationPrevious = ({ className, ...props }: PaginationItemProps) => (
  <li>
    <Button
      asChild
      variant="outline"
      size="icon"
      className={cn("h-9 w-9", {
        "pointer-events-none opacity-50": props.disabled,
      }, className)}
      {...props}
    >
      {props.href && !props.disabled ? (
        <Link {...props}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Link>
      ) : (
        <span {...props}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </span>
      )}
    </Button>
  </li>
);

const PaginationNext = ({ className, ...props }: PaginationItemProps) => (
  <li>
    <Button
      asChild
      variant="outline"
      size="icon"
      className={cn("h-9 w-9", {
        "pointer-events-none opacity-50": props.disabled,
      }, className)}
      {...props}
    >
      {props.href && !props.disabled ? (
        <Link {...props}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Link>
      ) : (
        <span {...props}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </span>
      )}
    </Button>
  </li>
);

const PaginationFirst = ({ className, ...props }: PaginationItemProps) => (
  <li>
    <Button
      asChild
      variant="outline"
      size="icon"
      className={cn("h-9 w-9", {
        "pointer-events-none opacity-50": props.disabled,
      }, className)}
      {...props}
    >
      {props.href && !props.disabled ? (
        <Link {...props}>
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">First page</span>
        </Link>
      ) : (
        <span {...props}>
          <ChevronsLeft className="h-4 w-4" />
          <span className="sr-only">First page</span>
        </span>
      )}
    </Button>
  </li>
);

const PaginationLast = ({ className, ...props }: PaginationItemProps) => (
  <li>
    <Button
      asChild
      variant="outline"
      size="icon"
      className={cn("h-9 w-9", {
        "pointer-events-none opacity-50": props.disabled,
      }, className)}
      {...props}
    >
      {props.href && !props.disabled ? (
        <Link {...props}>
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Last page</span>
        </Link>
      ) : (
        <span {...props}>
          <ChevronsRight className="h-4 w-4" />
          <span className="sr-only">Last page</span>
        </span>
      )}
    </Button>
  </li>
);

Pagination.Item = PaginationItem;
Pagination.Previous = PaginationPrevious;
Pagination.Next = PaginationNext;
Pagination.First = PaginationFirst;
Pagination.Last = PaginationLast;

export { Pagination };
