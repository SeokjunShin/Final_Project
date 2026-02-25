import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CampaignIcon from '@mui/icons-material/Campaign';
import EmailIcon from '@mui/icons-material/Email';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { apiClient } from '@/api/client';

interface NotificationItem {
  id: number;
  category: string;
  title: string;
  content?: string;
  read: boolean;
  createdAt: string;
}

const fallbackNotifications: NotificationItem[] = [
  { id: 1, category: 'NOTICE', title: '2월 시스템 점검 안내', content: '2026년 2월 28일 02:00~04:00 시스템 점검이 진행됩니다. 점검 시간 동안 일부 서비스 이용이 제한될 수 있습니다.', read: false, createdAt: '2026-02-24' },
  { id: 2, category: 'EVENT', title: '봄맞이 캐시백 이벤트 시작!', content: '3월 한 달간 진행되는 봄맞이 이벤트에 참여하세요. 최대 10만원 캐시백 기회!', read: false, createdAt: '2026-02-23' },
  { id: 3, category: 'MESSAGE', title: '문의 답변이 등록되었습니다', content: '고객님께서 문의하신 내용에 대한 답변이 등록되었습니다. 고객센터에서 확인해 주세요.', read: true, createdAt: '2026-02-22' },
  { id: 4, category: 'NOTICE', title: '포인트 정책 변경 안내', content: '2026년 3월 1일부터 포인트 전환 수수료가 3%로 변경됩니다. 자세한 내용은 공지사항을 확인해 주세요.', read: true, createdAt: '2026-02-20' },
  { id: 5, category: 'SYSTEM', title: '카드 발급이 완료되었습니다', content: 'MyCard Platinum 카드 발급이 완료되었습니다. 3~5일 내 배송될 예정입니다.', read: true, createdAt: '2026-02-18' },
];

const getCategoryInfo = (category: string) => {
  switch (category) {
    case 'NOTICE': return { label: '공지', color: '#1976d2', icon: <CampaignIcon sx={{ fontSize: 20 }} /> };
    case 'EVENT': return { label: '이벤트', color: '#ff9800', icon: <NotificationsIcon sx={{ fontSize: 20 }} /> };
    case 'MESSAGE': return { label: '메시지', color: '#4caf50', icon: <EmailIcon sx={{ fontSize: 20 }} /> };
    case 'SYSTEM': return { label: '시스템', color: '#9c27b0', icon: <InfoIcon sx={{ fontSize: 20 }} /> };
    default: return { label: category, color: '#666', icon: <NotificationsIcon sx={{ fontSize: 20 }} /> };
  }
};

export const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      try {
        const result = await notificationsApi.list();
        return result.length > 0 ? result : fallbackNotifications;
      } catch {
        return fallbackNotifications;
      }
    },
  });

  const notifications = data ?? fallbackNotifications;
  
  const filteredNotifications = tab === 0
    ? notifications
    : tab === 1
    ? notifications.filter((n: NotificationItem) => !n.read)
    : notifications.filter((n: NotificationItem) => n.category === 'NOTICE');

  const handleReadNotification = async (notification: NotificationItem) => {
    setSelectedNotification(notification);
    setDialogOpen(true);
    
    if (!notification.read) {
      try {
        await notificationsApi.read(notification.id);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch {
        // fallback data doesn't need API call
      }
    }
  };

  const unreadCount = notifications.filter((n: NotificationItem) => !n.read).length;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <NotificationsIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>알림센터</Typography>
        {unreadCount > 0 && (
          <Chip
            label={`${unreadCount}개 미확인`}
            size="small"
            sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 600 }}
          />
        )}
      </Stack>

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: '1px solid #e0e0e0',
            '& .MuiTab-root': { fontWeight: 600 },
            '& .Mui-selected': { color: '#d32f2f' },
            '& .MuiTabs-indicator': { bgcolor: '#d32f2f' },
          }}
        >
          <Tab label={`전체 (${notifications.length})`} />
          <Tab label={`미확인 (${unreadCount})`} />
          <Tab label="공지사항" />
        </Tabs>

        <Stack spacing={0}>
          {filteredNotifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: '#999' }}>
              <NotificationsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
              <Typography>알림이 없습니다</Typography>
            </Box>
          ) : (
            filteredNotifications.map((notification: NotificationItem) => {
              const categoryInfo = getCategoryInfo(notification.category);
              return (
                <Box
                  key={notification.id}
                  onClick={() => handleReadNotification(notification)}
                  sx={{
                    p: 2.5,
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    bgcolor: notification.read ? '#fff' : '#fffbfb',
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: '#fafafa' },
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: `${categoryInfo.color}15`,
                        color: categoryInfo.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {categoryInfo.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <Chip
                          label={categoryInfo.label}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: `${categoryInfo.color}15`,
                            color: categoryInfo.color,
                            fontWeight: 600,
                          }}
                        />
                        {!notification.read && (
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#d32f2f' }} />
                        )}
                      </Stack>
                      <Typography sx={{ fontWeight: notification.read ? 400 : 600, mb: 0.5 }}>
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {notification.createdAt}
                      </Typography>
                    </Box>
                    {notification.read && (
                      <CheckCircleIcon sx={{ color: '#ccc', fontSize: 20 }} />
                    )}
                  </Stack>
                </Box>
              );
            })
          )}
        </Stack>
      </Card>

      {/* Notification Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedNotification && (
          <>
            <DialogTitle>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  label={getCategoryInfo(selectedNotification.category).label}
                  size="small"
                  sx={{
                    bgcolor: `${getCategoryInfo(selectedNotification.category).color}15`,
                    color: getCategoryInfo(selectedNotification.category).color,
                    fontWeight: 600,
                  }}
                />
                <Typography sx={{ fontWeight: 700 }}>{selectedNotification.title}</Typography>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                {selectedNotification.createdAt}
              </Typography>
              <Typography sx={{ lineHeight: 1.8 }}>
                {selectedNotification.content || selectedNotification.title}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>확인</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
