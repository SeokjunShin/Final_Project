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
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { userMenu } from '@shared/menu';
import { useAuth } from '@/contexts/AuthContext';

const drawerWidth = 284;

export const UserLayout = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const crumbs = location.pathname.split('/').filter(Boolean);

  const drawer = (
    <Box sx={{ width: drawerWidth, height: '100%', bgcolor: '#0f2f67', color: '#dbe7ff' }}>
      <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <CreditCardIcon />
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800 }}>
            MYCARD PORTAL
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: '#a8c0ee' }}>
          금융거래/명세서/고객지원
        </Typography>
      </Box>
      <List sx={{ px: 1.2, py: 1.5 }}>
        {userMenu.map((item) => {
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
                color: active ? '#fff' : '#dbe7ff',
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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#eef3fb' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'rgba(255,255,255,0.94)',
          color: 'text.primary',
          borderBottom: '1px solid #dce6f6',
          backdropFilter: 'blur(8px)',
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
            {crumbs.map((c, i) => (
              <Typography key={`${c}-${i}`} color="text.primary">
                {c}
              </Typography>
            ))}
          </Breadcrumbs>
          <Link component={RouterLink} to="/" underline="hover" sx={{ mr: 2 }}>
            메인페이지
          </Link>
          <Typography sx={{ mr: 2, fontWeight: 600 }}>{user?.name}</Typography>
          <Link
            component="button"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            underline="hover"
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
