import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Layout from '../shared/Layout';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import AddContract from './AddContract';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      width: '100%',
      maxWidth: 800
    }
  }),
);

const Contracts = () => {
    const classes = useStyles();
    
    return (
        <Layout>
            <Card className={classes.root} variant="outlined">
              <CardHeader
                action={
                  <AddContract />
                }
                title="Contracts"
              />
              <CardContent>
                <Typography variant="body2" color="textSecondary" component="p">
                  Register your contract's here to be able to schedule its execution later.
                </Typography>
              </CardContent>
            </Card>
        </Layout>
    )
}

export default Contracts