import { createMuiTheme } from '@material-ui/core/styles';
import primary from '@material-ui/core/colors/blue';

const theme = createMuiTheme({
  palette: {
    primary
  },
  overrides: {
    MuiCssBaseline: {
      "@global": {
        body: {
          background: '#faf9f9 !important',
        },
      },
    },
    MuiCard: {
      root: {
        borderRadius: 20,
      }
    }
  },
  props: {
    MuiCard: {
      elevation: 0
    }
  }
});

export default theme