import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import ListSubheader from '@material-ui/core/ListSubheader';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import RefreshIcon from '@material-ui/icons/Refresh';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import IconButton from '@material-ui/core/IconButton';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Divider from '@material-ui/core/Divider';
import { teal, yellow, orange } from '@material-ui/core/colors';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      padding: 5,
      gap: '5px',
      display: 'flex',
      flexDirection: 'column'
    },
    
  }),
);

const useRowStyles = makeStyles((theme: Theme) =>
  createStyles({
    part: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1
    },
    row: ({ color = '#fff' }: any) => ({
        borderLeft: `${color} 4px solid`, borderBottom: `${color} 1px solid`, borderRadius: 15
    })
  }),
);

const Item = ({ color }: any) => {
    const classes = useRowStyles({ color });

    return (
        <ListItem button className={classes.row}>
            <ListItemText primary="Title" secondary="ExecuteAt | Status" className={classes.part} />
            <Divider orientation="vertical" style={{ marginRight: 16 }} flexItem />
            <ListItemText primary="Contract" secondary="Network | Provider" className={classes.part} />
            <ListItemSecondaryAction>
                <IconButton edge="end">
                    <RefreshIcon style={{ color }} />
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>
    )
}

const History = () => {
  const classes = useStyles();

  return (
    <Card>
        <CardHeader
            title="History"
        />
        <CardContent style={{ padding: 0 }}>
            <List
                subheader={
                    <ListSubheader component="div">
                        May 2021
                    </ListSubheader>
                }
                className={classes.root}
                >
                <Item />
                <Item />
                <Item color={yellow[400]} />
                <Item color={teal[400]} />
                <Item color={orange[400]} />
            </List> 
            <List
                subheader={
                    <ListSubheader component="div">
                        Jun 2021
                    </ListSubheader>
                }
                className={classes.root}
                >
                <Item />
                <Item />
                <Item color={yellow[400]} />
                <Item color={teal[400]} />
                <Item color={orange[400]} />
            </List> 
        </CardContent>
    </Card>
    
  );
}

export default History
