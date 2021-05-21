import { createMuiTheme } from '@material-ui/core/styles';
import primary from '@material-ui/core/colors/blue';

const theme = createMuiTheme({
    palette: {
        type: 'dark',
        primary
    },
    overrides: {
        MuiCssBaseline: {
          "@global": {
            body: {
              background: '#212121 !important',
            },
          },
        },
      },
});

export default theme