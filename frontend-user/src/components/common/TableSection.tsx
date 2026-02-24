import { Box, Skeleton, Typography } from '@mui/material';
import { DataGrid, type DataGridProps } from '@mui/x-data-grid';

interface Props extends DataGridProps {
  title?: string;
}

export const TableSection = ({ title, ...props }: Props) => {
  return (
    <Box>
      {title ? (
        <Typography variant="h6" sx={{ mb: 1 }}>
          {title}
        </Typography>
      ) : null}
      <DataGrid
        autoHeight
        disableRowSelectionOnClick
        pageSizeOptions={[10, 20, 50]}
        slots={{
          loadingOverlay: () => <Skeleton variant="rectangular" height={220} />,
        }}
        {...props}
      />
    </Box>
  );
};
