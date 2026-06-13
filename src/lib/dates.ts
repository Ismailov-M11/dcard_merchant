import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

export function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  return dayjs(value).format('DD.MM.YYYY');
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return dayjs(value).format('DD.MM.YYYY HH:mm');
}

export { dayjs };
