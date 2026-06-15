import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type TableOptions,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/EmptyState';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  options?: Partial<TableOptions<TData>>;
}

export function DataTable<TData>({ columns, data, isLoading, options }: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...options,
  });

  return (
    <div className="ios-table overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow
              key={hg.id}
              className="ios-table-head border-0 hover:bg-transparent"
            >
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="text-xs font-semibold py-3 border-0"
                  style={{ color: 'var(--ios-text-secondary)' }}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow
                key={i}
                className="border-0 border-b"
                style={{ borderColor: 'var(--ios-divider)' }}
              >
                {columns.map((_, j) => (
                  <TableCell key={j} className="py-3">
                    <Skeleton className="h-4 w-full rounded-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="ios-table-row border-0 border-b last:border-0"
                style={{ borderColor: 'var(--ios-divider)' }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="py-3"
                    style={{ color: 'var(--ios-text-primary)' }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="border-0 hover:bg-transparent">
              <TableCell colSpan={columns.length}>
                <EmptyState title="Нет данных" />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
