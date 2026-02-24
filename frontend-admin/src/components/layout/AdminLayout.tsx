import {
  AppBar,
  Box,
  Breadcrumbs,
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

const drawerWidth = 290;

export const AdminLayout = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAdminAuth();

  const visibleMenu = useMemo(
    () => adminMenu.filter((m) => m.roles.includes(user?.role ?? 'USER')),
    [user?.role],
  );

  const drawer = (
    <Box sx={{ width: drawerWidth, height: '100%', bgcolor: '#16233d', color: '#d8dfec' }}>
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
      <List sx={{ px: 1.2, py: 1.5 }}>
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
          <Typography sx={{ mr: 2, fontWeight: 600 }}>{user?.name}</Typography>
          <Link
            component="button"
            underline="hover"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            로그아웃
          </Link>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth } }}>
        {drawer}
      </Drawer>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3 }, py: 3, mt: 8, ml: { md: `${drawerWidth}px` } }}>
        <Outlet />
      </Box>
    </Box>
  );
};
