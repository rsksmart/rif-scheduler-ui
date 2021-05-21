import 'date-fns';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import Layout from '../shared/Layout';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import DateFnsUtils from '@date-io/date-fns';
import {
  MuiPickersUtilsProvider,
  KeyboardTimePicker,
  KeyboardDatePicker,
} from '@material-ui/pickers';
import { useState } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import { CardActions } from '@material-ui/core';
import ColorSelector from './ColorSelector';
import History from './History';

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

const Schedule = () => {
  const classes = useStyles();

  const [executeAt, setExecuteAt] = useState<Date | null>(null);
  const [fields, setFields] = useState({});

  const handleExecuteAtChange = (date: Date | null) => {
    setExecuteAt(date);
  };

  const handleFieldChange = (fieldName: string) => (event: any) => {
    setFields(values => ({...values, [fieldName]: event.target.value }))
  }

  return (
      <Layout>
          <Card className={classes.root} variant="outlined">
            <CardHeader
              title="Schedule"
            />
            <CardContent>
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <div style={{ display: "flex", flex: 1, gap: "4px" }}>
                  <TextField 
                      margin="dense"
                      label="Title"
                      variant="filled"
                      fullWidth
                      onChange={handleFieldChange("title")}
                  />
                  <ColorSelector onChange={handleFieldChange("color")} />
                </div>
                <div style={{ display: "flex", flex: 1, gap: "4px" }}>
                  <FormControl variant="filled" fullWidth margin="dense">
                    <InputLabel id="schedule-network">Network</InputLabel>
                    <Select
                        labelId="schedule-network"
                        onChange={handleFieldChange("network")}
                    >
                        <MenuItem value={'Mainnet'}>Mainnet</MenuItem>
                        <MenuItem value={'Testnet'}>Testnet</MenuItem>
                    </Select>
                  </FormControl>
                  <KeyboardDatePicker
                    margin="dense"
                    id="executeDate"
                    inputVariant="filled"
                    label="Date"
                    format="MM/dd/yyyy"
                    fullWidth={true}
                    value={executeAt}
                    onChange={handleExecuteAtChange}
                    KeyboardButtonProps={{
                      'aria-label': 'change date',
                    }}
                  />
                  <KeyboardTimePicker
                    margin="dense"
                    id="executeTime"
                    fullWidth={true}
                    label="Time"
                    inputVariant="filled"
                    value={executeAt}
                    onChange={handleExecuteAtChange}
                    KeyboardButtonProps={{
                      'aria-label': 'change time',
                    }}
                  />
                </div>
                <div style={{ display: "flex", flex: 1, gap: "4px" }}>
                  <FormControl variant="filled" fullWidth margin="dense">
                    <InputLabel id="schedule-provider">Provider</InputLabel>
                    <Select
                        labelId="schedule-provider"
                        onChange={handleFieldChange("provider")}
                    >
                        <MenuItem value={'RSK-Mainnet'}>RSK OneShoot Provider (Mainnet)</MenuItem>
                        <MenuItem value={'RSK-Testnet'}>RSK OneShoot Provider (Testnet)</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl variant="filled" fullWidth margin="dense">
                    <InputLabel id="schedule-contract">Contract</InputLabel>
                    <Select
                        labelId="schedule-contract"
                        onChange={handleFieldChange("contract")}
                    >
                        <MenuItem value={'contract-1'}>Contract #1</MenuItem>
                        <MenuItem value={'contract-2'}>Contract #2</MenuItem>
                        <MenuItem value={'contract-3'}>Contract #3</MenuItem>
                        <MenuItem value={'contract-4'}>Contract #4</MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </MuiPickersUtilsProvider>
            </CardContent>
            <CardActions style={{justifyContent: 'flex-end'}}>
              <Button onClick={undefined} color="inherit">
                Clear
              </Button>
              <Button onClick={undefined} color="primary">
                Save
              </Button>
            </CardActions>
          </Card>
          <div className={classes.root} style={{ marginTop: 15 }}>
            <History />
          </div>
      </Layout>
  )
}

export default Schedule