import { useState } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useTheme } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import AddIcon from "@material-ui/icons/AddCircle";
import TextField from "@material-ui/core/TextField";
import useContracts, { IContract } from "./useContracts";
import useConnector from "../connect/useConnector";
import NetworkLabel from "../connect/NetworkLabel";

const AddEditContract = ({
  hideButton = false,
  initialFields = null,
  onClose,
}: {
  onClose?: () => void;
  hideButton?: boolean;
  initialFields?: IContract | null;
}) => {
  const [open, setOpen] = useState(initialFields ? true : false);
  const [fields, setFields] =
    useState<Partial<IContract> | null>(initialFields);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const connectedToNetwork = useConnector(state => state.network)

  const save = useContracts((state) => state.save);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setFields(null);
    setOpen(false);

    if (onClose) onClose();
  };

  const handleSave = () => {
    // TODO: validate contract fields
    const isValid =
      fields && fields.ABI && fields.address && fields.name;

    if (isValid) {
      save({
        ...(fields as IContract),
        network: connectedToNetwork!,
        id: fields?.id ?? `${connectedToNetwork}-${fields?.address}`,
      });

      setFields(null);
      setOpen(false);
      if (onClose) onClose();
    }
  };

  const handleFieldChange = (fieldName: string) => (event: any) => {
    setFields((values) => ({ ...values, [fieldName]: event.target.value }));
  };

  return (
    <>
      {!hideButton && (
        <IconButton
          aria-label="add contract"
          size="small"
          onClick={handleClickOpen}
        >
          <AddIcon />
        </IconButton>
      )}
      <Dialog
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth={true}
        open={open}
        onClose={handleClose}
      >
        <DialogTitle>
          <div style={{display:"flex", flex:1}}>
            <div style={{display:"flex", flex:1}}>{fields?.id ? "Edit contract" : "Register new contract"}</div>
            <NetworkLabel />
          </div>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            helperText="Give your contract a name to make it easier to identify. Only for display purposes."
            variant="filled"
            fullWidth
            onChange={handleFieldChange("name")}
            value={fields?.name}
          />
          <TextField
            margin="dense"
            label="Address"
            helperText="Add your contract address"
            variant="filled"
            fullWidth
            onChange={handleFieldChange("address")}
            value={fields?.address}
          />
          <TextField
            margin="dense"
            label="ABI"
            helperText="Paste your contract's ABI code here to be able to schedule its execution later."
            variant="filled"
            fullWidth
            multiline
            rows={8}
            onChange={handleFieldChange("ABI")}
            value={fields?.ABI}
          />
        </DialogContent>
        <DialogActions
          style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 24 }}
        >
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary" variant="outlined">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddEditContract;
