import { useState } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useTheme } from "@material-ui/core/styles";
import AddIcon from "@material-ui/icons/AddCircle";
import TextField from "@material-ui/core/TextField";
import useContracts, { IContract } from "./useContracts";
import useConnector from "../connect/useConnector";
import NetworkLabel from "../connect/NetworkLabel";
import { ENetwork } from "../shared/types";

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
  const [fields, setFields] = useState<Partial<IContract> | null>(
    initialFields
  );
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const connectedToNetwork = useConnector((state) => state.network);

  const save = useContracts((state) => state.save);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setFields(null);
    setOpen(false);

    if (onClose) onClose();
  };

  const handleFillExample = () => {
    const address = "0xfb602d3e9f3941ccd6792447d12221d54f6c51a0";

    setFields({
      id: `${connectedToNetwork}-${address}`,
      name: "Counter Example",
      address: address,
      ABI: JSON.stringify(
        [
          {
            anonymous: false,
            inputs: [
              {
                indexed: false,
                internalType: "uint256",
                name: "count",
                type: "uint256",
              },
            ],
            name: "Counted",
            type: "event",
          },
          {
            inputs: [],
            name: "count",
            outputs: [
              {
                internalType: "uint256",
                name: "",
                type: "uint256",
              },
            ],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "inc",
            outputs: [],
            stateMutability: "payable",
            type: "function",
          },
          {
            inputs: [],
            name: "fail",
            outputs: [],
            stateMutability: "pure",
            type: "function",
          },
        ],
        null,
        2
      ),
    });
  };

  const handleSave = () => {
    // TODO: validate contract fields
    const isValid = fields && fields.ABI && fields.address && fields.name;

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
        <Button
          aria-label="add contract"
          color="primary"
          variant="contained"
          size="small"
          endIcon={<AddIcon />}
          onClick={handleClickOpen}
        >
          Register
        </Button>
      )}
      <Dialog
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth={true}
        open={open}
        onClose={handleClose}
      >
        <DialogTitle>
          <div style={{ display: "flex", flex: 1 }}>
            <div style={{ display: "flex", flex: 1 }}>
              {fields?.id ? "Edit contract" : "Register new contract"}
            </div>
            <NetworkLabel />
          </div>
        </DialogTitle>
        <DialogContent key={`add-edit-contract-${fields?.id}`}>
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
          {connectedToNetwork === ENetwork.RSKTestnet && (
            <div style={{ display: "flex", flex: 1 }}>
              <Button onClick={handleFillExample} color="secondary">
                Fill example
              </Button>
            </div>
          )}
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddEditContract;
