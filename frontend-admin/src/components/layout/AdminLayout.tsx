import {
  AppBar,
  Box,
  Breadcrumbs,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { adminMenu, type MenuItemDef } from '@shared/menu';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { AdminChangePasswordDialog } from '@/components/common/AdminChangePasswordDialog';

const drawerWidth = 290;

export const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  const [isPwdDialogOpen, setIsPwdDialogOpen] = useState(false);
  const [checkingPath, setCheckingPath] = useState<string | null>(null);
  const [accessDeniedOpen, setAccessDeniedOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, refreshSession } = useAdminAuth();

  const visibleMenu = useMemo(() => adminMenu, []);

  const handleMenuNavigate = async (item: MenuItemDef) => {
    setCheckingPath(item.path);
    try {
      const profile = await refreshSession();
      if (!profile) {
        navigate('/login');
        return;
      }

      if (item.roles.includes(profile.role)) {
        navigate(item.path);
      } else {
        setAccessDeniedOpen(true);
      }
    } finally {
      setOpen(false);
      setCheckingPath(null);
    }
  };

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
              disabled={checkingPath !== null}
              onClick={() => {
                void handleMenuNavigate(item);
              }}
              sx={{
                borderRadius: 2,
                mb: 0.4,
                color: active ? '#fff' : '#d8dfec',
                opacity: checkingPath === item.path ? 0.72 : 1,
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
            <Link
              component="button"
              underline="hover"
              sx={{ fontSize: 13, lineHeight: 1, color: 'text.secondary' }}
              onClick={() => setIsPwdDialogOpen(true)}
            >
              비밀번호 변경
            </Link>
            <Box sx={{ width: '1px', height: 16, bgcolor: '#d0d5dd' }} />
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

      <AdminChangePasswordDialog
        open={isPwdDialogOpen}
        onClose={() => setIsPwdDialogOpen(false)}
      />

      <Dialog open={accessDeniedOpen} onClose={() => setAccessDeniedOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>권한 없음</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary">
            해당 기능에 접근할 권한이 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setAccessDeniedOpen(false)} sx={{ bgcolor: '#16233d', '&:hover': { bgcolor: '#0d1626' } }}>
            확인
          </Button>
        </DialogActions>
      </Dialog>

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
    </Box>
  );
};
