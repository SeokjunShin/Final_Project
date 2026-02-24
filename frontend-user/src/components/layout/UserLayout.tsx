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
import { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { userMenu } from '@shared/menu';
import { useAuth } from '@/contexts/AuthContext';

const drawerWidth = 250;

export const UserLayout = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const crumbs = location.pathname.split('/').filter(Boolean);

  const drawer = (
    <Box sx={{ width: drawerWidth }}>
      <Typography variant="h6" sx={{ p: 2, fontWeight: 700 }}>
        MyCard
      </Typography>
      <List>
        {userMenu.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname.startsWith(item.path)}
            onClick={() => {
              navigate(item.path);
              setOpen(false);
            }}
          >
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'white',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton sx={{ display: { md: 'none' }, mr: 1 }} onClick={() => setOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Breadcrumbs sx={{ flex: 1 }}>
            <Link component={RouterLink} to="/dashboard" underline="hover">
              홈
            </Link>
            {crumbs.map((c, i) => (
              <Typography key={`${c}-${i}`} color="text.primary">
                {c}
              </Typography>
            ))}
          </Breadcrumbs>
          <Typography sx={{ mr: 2 }}>{user?.name}</Typography>
          <Link
            component="button"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            로그아웃
          </Link>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' } }}>
        {drawer}
      </Drawer>
      <Drawer open={open} onClose={() => setOpen(false)} sx={{ display: { xs: 'block', md: 'none' } }}>
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flex: 1,
          p: 3,
          mt: 8,
          ml: { md: `${drawerWidth}px` },
          backgroundColor: '#f5f7fb',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
