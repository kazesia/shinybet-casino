export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    read: boolean;
    type: 'info' | 'warning' | 'promo' | 'system';
    link?: string;
    created_at: string;
}
