import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bell, Send, Users, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Notification } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';

export default function AdminNotifications() {
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'promo' | 'system'>('info');
    const [link, setLink] = useState('');
    const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
    const [targetEmail, setTargetEmail] = useState('');

    // Fetch notification history
    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            toast.error('Failed to load notification history');
        } finally {
            setLoadingHistory(false);
        }
    };

    // Send notification
    const handleSend = async () => {
        if (!title || !message) {
            toast.error('Please fill in title and message');
            return;
        }

        setLoading(true);
        try {
            if (targetType === 'all') {
                // Broadcast to all users
                const { data: users, error: usersError } = await supabase
                    .from('profiles')
                    .select('id');

                if (usersError) throw usersError;

                const notificationData = users.map(user => ({
                    user_id: user.id,
                    title,
                    message,
                    type,
                    link: link || null,
                }));

                const { error } = await supabase
                    .from('notifications')
                    .insert(notificationData);

                if (error) throw error;

                toast.success(`Notification sent to ${users.length} users!`);
            } else {
                // Send to specific user - query auth.users for email
                const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();

                if (authError) {
                    console.error('Error fetching users:', authError);
                    toast.error('Failed to fetch users');
                    return;
                }

                const targetUser = authUser.users.find(u => u.email === targetEmail);

                if (!targetUser) {
                    toast.error('User not found');
                    return;
                }

                const { error } = await supabase
                    .from('notifications')
                    .insert({
                        user_id: targetUser.id,
                        title,
                        message,
                        type,
                        link: link || null,
                    });

                if (error) throw error;

                toast.success('Notification sent successfully!');
            }

            // Reset form
            setTitle('');
            setMessage('');
            setLink('');
            setTargetEmail('');

            // Refresh history
            fetchHistory();
        } catch (error) {
            console.error('Error sending notification:', error);
            toast.error('Failed to send notification');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f212e] p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Bell className="w-8 h-8 text-[#1475e1]" />
                    <div>
                        <h1 className="text-3xl font-bold text-white">Notifications</h1>
                        <p className="text-[#b1bad3]">Send notifications to users</p>
                    </div>
                </div>

                <Tabs defaultValue="send" className="w-full">
                    <TabsList className="bg-[#1a2c38] border border-[#2f4553]">
                        <TabsTrigger value="send">Send Notification</TabsTrigger>
                        <TabsTrigger value="history" onClick={fetchHistory}>History</TabsTrigger>
                    </TabsList>

                    {/* Send Notification Tab */}
                    <TabsContent value="send">
                        <Card className="bg-[#1a2c38] border-[#2f4553]">
                            <CardHeader>
                                <CardTitle className="text-white">Broadcast Notification</CardTitle>
                                <CardDescription className="text-[#b1bad3]">
                                    Send notifications to all users or specific users
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Target Type */}
                                <div className="space-y-2">
                                    <Label className="text-white">Target</Label>
                                    <div className="flex gap-4">
                                        <Button
                                            variant={targetType === 'all' ? 'default' : 'outline'}
                                            onClick={() => setTargetType('all')}
                                            className={targetType === 'all' ? 'bg-[#1475e1]' : 'border-[#2f4553] text-[#b1bad3]'}
                                        >
                                            <Users className="w-4 h-4 mr-2" />
                                            All Users
                                        </Button>
                                        <Button
                                            variant={targetType === 'specific' ? 'default' : 'outline'}
                                            onClick={() => setTargetType('specific')}
                                            className={targetType === 'specific' ? 'bg-[#1475e1]' : 'border-[#2f4553] text-[#b1bad3]'}
                                        >
                                            <User className="w-4 h-4 mr-2" />
                                            Specific User
                                        </Button>
                                    </div>
                                </div>

                                {/* Target Email (if specific) */}
                                {targetType === 'specific' && (
                                    <div className="space-y-2">
                                        <Label className="text-white">User Email</Label>
                                        <Input
                                            value={targetEmail}
                                            onChange={(e) => setTargetEmail(e.target.value)}
                                            placeholder="user@example.com"
                                            className="bg-[#0f212e] border-[#2f4553] text-white"
                                        />
                                    </div>
                                )}

                                {/* Title */}
                                <div className="space-y-2">
                                    <Label className="text-white">Title *</Label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Notification title"
                                        className="bg-[#0f212e] border-[#2f4553] text-white"
                                    />
                                </div>

                                {/* Message */}
                                <div className="space-y-2">
                                    <Label className="text-white">Message *</Label>
                                    <Textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Notification message"
                                        rows={4}
                                        className="bg-[#0f212e] border-[#2f4553] text-white resize-none"
                                    />
                                </div>

                                {/* Type */}
                                <div className="space-y-2">
                                    <Label className="text-white">Type</Label>
                                    <Select value={type} onValueChange={(v: any) => setType(v)}>
                                        <SelectTrigger className="bg-[#0f212e] border-[#2f4553] text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1a2c38] border-[#2f4553]">
                                            <SelectItem value="info">Info</SelectItem>
                                            <SelectItem value="warning">Warning</SelectItem>
                                            <SelectItem value="promo">Promotion</SelectItem>
                                            <SelectItem value="system">System</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Link (Optional) */}
                                <div className="space-y-2">
                                    <Label className="text-white">Link (Optional)</Label>
                                    <Input
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                        placeholder="/vip-club"
                                        className="bg-[#0f212e] border-[#2f4553] text-white"
                                    />
                                </div>

                                {/* Send Button */}
                                <Button
                                    onClick={handleSend}
                                    disabled={loading}
                                    className="w-full bg-[#1475e1] hover:bg-[#1266c9] text-white font-bold"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4 mr-2" />
                                            Send Notification
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history">
                        <Card className="bg-[#1a2c38] border-[#2f4553]">
                            <CardHeader>
                                <CardTitle className="text-white">Notification History</CardTitle>
                                <CardDescription className="text-[#b1bad3]">
                                    Recent notifications sent to users
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingHistory ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 text-[#b1bad3] animate-spin" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="text-center py-12 text-[#b1bad3]">
                                        No notifications sent yet
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-[#2f4553]">
                                                    <TableHead className="text-[#b1bad3]">Title</TableHead>
                                                    <TableHead className="text-[#b1bad3]">Message</TableHead>
                                                    <TableHead className="text-[#b1bad3]">Type</TableHead>
                                                    <TableHead className="text-[#b1bad3]">Time</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {notifications.map((notification) => (
                                                    <TableRow key={notification.id} className="border-[#2f4553]">
                                                        <TableCell className="text-white font-medium">
                                                            {notification.title}
                                                        </TableCell>
                                                        <TableCell className="text-[#b1bad3] max-w-md truncate">
                                                            {notification.message}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${notification.type === 'warning' ? 'bg-orange-500/20 text-orange-500' :
                                                                notification.type === 'promo' ? 'bg-purple-500/20 text-purple-500' :
                                                                    notification.type === 'system' ? 'bg-blue-500/20 text-blue-500' :
                                                                        'bg-[#1475e1]/20 text-[#1475e1]'
                                                                }`}>
                                                                {notification.type}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-[#b1bad3] text-sm">
                                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
