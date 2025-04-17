import { Breadcrumb as ShadcnBreadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Breadcrumb } from '@/types';
import { Link } from '@inertiajs/react';
import { Fragment } from 'react';

interface BreadcrumbsProps {
    breadcrumbs?: Breadcrumb[];
}

export function Breadcrumbs({ breadcrumbs }: BreadcrumbsProps) {
    if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
        return null;
    }

    return (
        <ShadcnBreadcrumb>
            <BreadcrumbList>
                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                        <Fragment key={index}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{item.title}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        {item.href ? (
                                            <Link href={item.href}>{item.title}</Link>
                                        ) : (
                                            <span>{item.title}</span>
                                        )}
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </ShadcnBreadcrumb>
    );
}
