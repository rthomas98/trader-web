/**
 * Type declarations for shadcn/ui components
 * This file provides TypeScript type definitions for the shadcn/ui components used in the application
 */

declare module '@/components/ui/table' {
  import * as React from 'react';

  export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
    children: React.ReactNode;
  }

  export interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {
    children: React.ReactNode;
  }

  export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
    children: React.ReactNode;
  }

  export interface TableFooterProps extends React.HTMLAttributes<HTMLTableSectionElement> {
    children: React.ReactNode;
  }

  export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    children?: React.ReactNode;
  }

  export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    children: React.ReactNode;
  }

  export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
    children?: React.ReactNode;
  }

  export interface TableCaptionProps extends React.HTMLAttributes<HTMLTableCaptionElement> {
    children: React.ReactNode;
  }

  export const Table: React.ForwardRefExoticComponent<TableProps & React.RefAttributes<HTMLTableElement>>;
  export const TableHeader: React.ForwardRefExoticComponent<TableHeaderProps & React.RefAttributes<HTMLTableSectionElement>>;
  export const TableBody: React.ForwardRefExoticComponent<TableBodyProps & React.RefAttributes<HTMLTableSectionElement>>;
  export const TableFooter: React.ForwardRefExoticComponent<TableFooterProps & React.RefAttributes<HTMLTableSectionElement>>;
  export const TableHead: React.ForwardRefExoticComponent<TableHeadProps & React.RefAttributes<HTMLTableCellElement>>;
  export const TableRow: React.ForwardRefExoticComponent<TableRowProps & React.RefAttributes<HTMLTableRowElement>>;
  export const TableCell: React.ForwardRefExoticComponent<TableCellProps & React.RefAttributes<HTMLTableCellElement>>;
  export const TableCaption: React.ForwardRefExoticComponent<TableCaptionProps & React.RefAttributes<HTMLTableCaptionElement>>;
}
