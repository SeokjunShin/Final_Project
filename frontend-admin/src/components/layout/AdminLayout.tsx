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
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useMemo, useState } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { adminMenu } from '@shared/menu';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { AdminPasswordChangeDialog } from '@/components/profile/AdminPasswordChangeDialog';

const drawerWidth = 290;

export const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAdminAuth();

  const visibleMenu = useMemo(
    () => adminMenu.filter((item) => user?.role && item.roles.includes(user.role as any)),
    [user?.role],
  );

  const drawer = (
    <Box sx={{ width: drawerWidth, height: '100%', bgcolor: '#16233d', color: '#d8dfec', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2.6, borderBottom: '1px solid rgba(255,255,255,0.11)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <AdminPanelSettingsIcon />
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800 }}>
            MYCARD ADMIN
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: '#9aaccc' }}>
          운영/정책/감사 관리
        </Typography>
      </Box>
      <List sx={{ px: 1.2, py: 1.5, flex: 1, overflowY: 'auto' }}>
        {visibleMenu.map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <ListItemButton
              key={item.path}
              selected={active}
              onClick={() => {
                navigate(item.path);
                setOpen(false);
              }}
              sx={{
                borderRadius: 2,
                mb: 0.4,
                color: active ? '#fff' : '#d8dfec',
                '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.14)' },
                '&.Mui-selected:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 500 }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#eff3fa' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'rgba(255,255,255,0.95)',
          color: 'text.primary',
          borderBottom: '1px solid #dde5f3',
          backdropFilter: 'blur(7px)',
        }}
      >
        <Toolbar>
          <IconButton sx={{ display: { md: 'none' }, mr: 1 }} onClick={() => setOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Breadcrumbs sx={{ flex: 1 }}>
            <Link component={RouterLink} to="/dashboard" underline="hover" color="inherit">
              홈
            </Link>
            {location.pathname
              .split('/')
              .filter(Boolean)
              .map((crumb, idx) => (
                <Typography key={`${crumb}-${idx}`}>{crumb}</Typography>
              ))}
          </Breadcrumbs>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Typography sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1 }}>{user?.name}</Typography>
            <Typography
              component="span"
              sx={{
                px: 1,
                py: 0.25,
                borderRadius: '5px',
                fontSize: 11,
                fontWeight: 600,
                lineHeight: 1.4,
                letterSpacing: 0.3,
                border: '1px solid',
                borderColor:
                  user?.role === 'MASTER_ADMIN' ? 'rgba(124,58,237,0.35)' :
                    user?.role === 'REVIEW_ADMIN' ? 'rgba(37,99,235,0.35)' : 'rgba(22,163,74,0.35)',
                bgcolor:
                  user?.role === 'MASTER_ADMIN' ? 'rgba(124,58,237,0.08)' :
                    user?.role === 'REVIEW_ADMIN' ? 'rgba(37,99,235,0.08)' : 'rgba(22,163,74,0.08)',
                color:
                  user?.role === 'MASTER_ADMIN' ? '#7c3aed' :
                    user?.role === 'REVIEW_ADMIN' ? '#2563eb' : '#16a34a',
              }}
            >
              {user?.role === 'MASTER_ADMIN' ? '최고관리자' :
                user?.role === 'REVIEW_ADMIN' ? '심사관리자' :
                  user?.role === 'OPERATOR' ? '상담사' : user?.role}
            </Typography>
            <Box sx={{ width: '1px', height: 16, bgcolor: '#d0d5dd' }} />
            <Button
              variant="text"
              size="small"
              sx={{ minWidth: 0, px: 0.5, fontSize: 13 }}
              onClick={() => setPasswordDialogOpen(true)}
            >
              비밀번호 변경
            </Button>
            <Link
              component="button"
              underline="hover"
              sx={{ fontSize: 13, lineHeight: 1 }}
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
            >
              로그아웃
            </Link>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: '#16233d' } }}>
        {drawer}
      </Drawer>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: '#16233d' } }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3 }, py: 3, mt: 8, ml: { md: `${drawerWidth}px` } }}>
        <Outlet />
      </Box>
      <AdminPasswordChangeDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
      />
    </Box>
  );
};
