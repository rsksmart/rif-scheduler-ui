import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Logo from '../assets/Logo';
import { Link } from 'react-router-dom'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      marginLeft: -15,
      flexGrow: 1,
      '@media (max-width: 500px)': {
          display: 'none'
      }
    },
    navButtons: {
        display: 'flex',
        flex: 1,
        justifyContent: 'flex-end',
        gap: '5px'
    },
    toolbar: {
        display: 'flex',
        flex: 1,
        width: '100%',
        maxWidth: 800
    },
    appBar: {
        display: 'flex', 
        flex: 1, 
        alignItems: 'center', 
        backgroundColor: '#333'
    }
  }),
);

const Layout: React.FC = ({ children }) => {
    const classes = useStyles();
    
    return (
        <>
            <AppBar position="sticky" className={classes.appBar}>
                <Toolbar className={classes.toolbar}>
                    <Logo style={{ height: 32 }} />
                    <Typography variant="h6" className={classes.title}>
                        rif scheduler
                    </Typography>
                    <div className={classes.navButtons}>
                        <Button color="inherit" component={Link} to='/'>Schedule</Button>
                        <Button color="inherit" component={Link} to='/providers'>Providers</Button>
                        <Button color="inherit" component={Link} to='/contracts'>Contracts</Button>
                    </div>
                </Toolbar>
            </AppBar>
            <div style={{
                padding: 15,
                display: 'flex', 
                flex: 1, 
                alignItems: 'center', 
                flexDirection: 'column'
            }}>
                {children}
            </div>
        </>
    )
}

export default Layout