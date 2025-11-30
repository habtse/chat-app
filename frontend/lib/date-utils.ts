import { formatDistanceToNow } from 'date-fns';

export function formatLastSeen(date: string | Date | null | undefined): string {
    if (!date) return '';

    try {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        return `Last seen ${formatDistanceToNow(dateObj, { addSuffix: true })}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
}
