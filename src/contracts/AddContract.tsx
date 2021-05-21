import { useState } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useTheme } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import AddIcon from '@material-ui/icons/AddCircle';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';

const AddContract = () => {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState({});
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleClickOpen = () => {
    setOpen(true)
  };

  const handleClose = () => {
    setFields({})
    setOpen(false)
  };

  const handleSave = () => {
    console.log("fields", fields)
    setFields({})
    setOpen(false)
  }

  const handleFieldChange = (fieldName: string) => (event: any) => {
    setFields(values => ({...values, [fieldName]: event.target.value }))
  }

  return (
    <>
      <IconButton aria-label="add contract" size="small" onClick={handleClickOpen}>
        <AddIcon />
      </IconButton>
      <Dialog
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth={true}
        open={open}
        onClose={handleClose}
      >
        <DialogTitle>Register new contract</DialogTitle>
        <DialogContent>
            <TextField  
                autoFocus
                margin="dense"
                label="Name"
                helperText="Give your contract a name to make it easier to identify it. Only for display purposes."
                variant="filled"
                fullWidth
                onChange={handleFieldChange("name")}
            />
            <FormControl variant="filled" fullWidth margin="dense">
                <InputLabel id="add-contract-network">Network</InputLabel>
                <Select
                    labelId="add-contract-network"
                    onChange={handleFieldChange("network")}
                >
                    <MenuItem value={'Mainnet'}>Mainnet</MenuItem>
                    <MenuItem value={'Testnet'}>Testnet</MenuItem>
                </Select>
                <FormHelperText>Select the network you want to work with.</FormHelperText>
            </FormControl>
            <TextField
                margin="dense"
                label="Address"
                helperText="Your contract address"
                variant="filled"
                fullWidth
                onChange={handleFieldChange("address")}
            />
            <TextField
                margin="dense"
                label="ABI"
                helperText="Paste your contract's ABI code here to be able to schedule its execution later."
                variant="filled"
                fullWidth
                multiline
                rows={4}
                onChange={handleFieldChange("abi")}
            />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AddContract
