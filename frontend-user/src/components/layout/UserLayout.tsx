import {
  AppBar,
  Box,
  Breadcrumbs,
  Button,
  Drawer,
  IconButton,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Dialog,
  DialogContent,
  DialogTitle
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
import { useState, useEffect } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { userMenu } from '@shared/menu';
import { useAuth } from '@/contexts/AuthContext';
import { SecureKeypad } from '@/components/common/SecureKeypad';
import { authApi } from '@/api';

const drawerWidth = 305;

const menuIcons: Record<string, React.ReactNode> = {
  '/dashboard': <DashboardIcon />,
  '/cards': <CreditCardIcon />,
  '/statements': <ReceiptLongIcon />,
  '/approvals': <CheckCircleIcon />,
  '/points': <CardGiftcardIcon />,
  '/notifications': <NotificationsIcon />,
  '/support/inquiries': <SupportAgentIcon />,
};

export const UserLayout = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const crumbs = location.pathname.split('/').filter(Boolean);

  const drawer = (
    <Box
      sx={{
        width: drawerWidth,
        height: '100%',
        minHeight: 0,
        bgcolor: '#1a1a1a',
        color: '#999',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ flexShrink: 0, p: 2.5, borderBottom: '1px solid #333' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 1, bgcolor: '#d32f2f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCardIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>
              MyCard
            </Typography>
            <Typography variant="caption" sx={{ color: '#666', fontSize: '0.7rem' }}>
              금융 포털
            </Typography>
          </Box>
        </Box>
      </Box>
      <List
        sx={{
          px: 1.5,
          py: 2,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {userMenu.map((item) => {
          const active =
            location.pathname === item.path ||
            // 하위 경로에서도 활성 표시 (단, '/cards'처럼 다른 메뉴의 상위 경로인 경우는 제외)
            (item.path !== '/cards' && location.pathname.startsWith(`${item.path}/`));
          return (
            <ListItemButton
              key={item.path}
              selected={active}
              onClick={() => {
                navigate(item.path);
                setOpen(false);
              }}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                py: 1.2,
                color: active ? '#fff' : '#999',
                bgcolor: active ? '#d32f2f' : 'transparent',
                '&.Mui-selected': { bgcolor: '#d32f2f' },
                '&.Mui-selected:hover': { bgcolor: '#b71c1c' },
                '&:hover': { bgcolor: active ? '#b71c1c' : 'rgba(255,255,255,0.05)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: active ? '#fff' : '#666' }}>
                {menuIcons[item.path] || <DashboardIcon />}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Box sx={{ flexShrink: 0, p: 2, borderTop: '1px solid #333', bgcolor: '#1a1a1a' }}>
        <Box sx={{ bgcolor: '#252525', borderRadius: 2, p: 2, mb: 2 }}>
          <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem', mb: 0.5 }}>{user?.name || '사용자'}</Typography>
          <Typography sx={{ color: '#666', fontSize: '0.75rem' }}>{user?.email || ''}</Typography>
        </Box>
        <Button
          fullWidth
          startIcon={<HomeIcon />}
          component={RouterLink}
          to="/"
          sx={{ color: '#999', justifyContent: 'flex-start', mb: 1, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
        >
          메인페이지
        </Button>
        <Button
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={async () => { await logout(); navigate('/login'); }}
          sx={{
            color: '#999',
            backgroundColor: 'transparent',
            justifyContent: 'flex-start',
            textTransform: 'none',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
            '& .MuiButton-startIcon': { color: 'inherit' },
          }}
        >
          로그아웃
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: '#fff',
          color: 'text.primary',
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Toolbar>
          <IconButton sx={{ display: { md: 'none' }, mr: 1, color: '#d32f2f' }} onClick={() => setOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Breadcrumbs sx={{ flex: 1 }}>
            <Link component={RouterLink} to="/dashboard" underline="hover" sx={{ color: '#d32f2f' }}>
              홈
            </Link>
            {crumbs.map((c, i) => (
              <Typography key={`${c}-${i}`} color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                {c}
              </Typography>
            ))}
          </Breadcrumbs>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, overflow: 'hidden' } }}>
        {drawer}
      </Drawer>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, overflow: 'hidden' } }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flex: 1,
          px: { xs: 2, md: 3 },
          py: 3,
          mt: 8,
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Outlet />
      </Box>

    </Box>
  );
};
