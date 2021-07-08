import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Logo from "../assets/Logo";
import { Link } from "react-router-dom";
import BottomNavigation from "@material-ui/core/BottomNavigation";
import BottomNavigationAction from "@material-ui/core/BottomNavigationAction";
import ScheduleIcon from "@material-ui/icons/Schedule";
import ProvidersIcon from "@material-ui/icons/Store";
import ContractsIcon from "@material-ui/icons/Extension";
import AccountIcon from "@material-ui/icons/AccountCircle";
import { useLocation } from "react-router-dom";
import useScrollTrigger from '@material-ui/core/useScrollTrigger';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    logo: ({ hideMenu }: any) => ({
      height: 32,
      "@media (max-width: 380px)": {
        display: hideMenu ? "initial" : "none",
      },
    }),
    title: ({ hideMenu }: any) => ({
      marginTop: 8,
      marginLeft: 5,
      flexGrow: 1,
      "@media (max-width: 500px)": {
        display: hideMenu ? "initial" : "none",
      },
    }),
    navButtons: {
      display: "flex",
      flex: 1,
      justifyContent: "flex-end",
      gap: "5px",
    },
    toolbar: {
      display: "flex",
      flex: 1,
      width: "100%",
      maxWidth: 800,
      padding: 0,
      paddingLeft: 12,
    },
    appBar: ({ scrolled }) => ({
      display: "flex",
      flex: 1,
      alignItems: "center",
      backgroundColor: "#faf9f9",
      padding: 0,
      boxShadow: scrolled ? "0px 5px 20px -5px rgb(0 0 0 / 25%)" : "none"
    }),
  })
);

const menuIndexes: { [key: string]: number } = {
  "/": 0,
  "/store": 1,
  "/contracts": 2,
  "/account": 3,
};

const Layout: React.FC<{ hideMenu?: boolean }> = ({ children, hideMenu }) => {
  const location = useLocation();
  const scrolled = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });
  const classes = useStyles({ hideMenu, scrolled });

  return (
    <>
      <AppBar position="sticky" className={classes.appBar} elevation={0}>
        <Toolbar className={classes.toolbar}>
          <Logo className={classes.logo} />
          <Typography variant="h6" className={classes.title} color="textPrimary">
            scheduler
          </Typography>
          {!hideMenu && (
            <div className={classes.navButtons}>
              <BottomNavigation
                showLabels
                value={menuIndexes[location.pathname]}
                style={{ background: "transparent" }}
              >
                <BottomNavigationAction
                  label="Schedule"
                  icon={<ScheduleIcon />}
                  component={Link}
                  style={{ padding: "8px 12px 6px" }}
                  to="/"
                />
                <BottomNavigationAction
                  label="Store"
                  icon={<ProvidersIcon />}
                  component={Link}
                  style={{ padding: "8px 12px 6px" }}
                  to="/store"
                />
                <BottomNavigationAction
                  label="Contracts"
                  icon={<ContractsIcon />}
                  component={Link}
                  style={{ padding: "8px 12px 6px" }}
                  to="/contracts"
                />
                <BottomNavigationAction
                  label="Account"
                  icon={<AccountIcon />}
                  component={Link}
                  style={{ padding: "8px 12px 6px" }}
                  to="/account"
                />
              </BottomNavigation>
            </div>
          )}
        </Toolbar>
      </AppBar>
      <div
        style={{
          padding: 15,
          display: "flex",
          flex: 1,
          alignItems: "center",
          flexDirection: "column",
          paddingBottom: 60
        }}
      >
        {children}
      </div>
    </>
  );
};

export default Layout;
