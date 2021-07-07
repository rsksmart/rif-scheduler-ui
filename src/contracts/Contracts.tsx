import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Layout from "../shared/Layout";
import Card from "@material-ui/core/Card";
import CardHeader from "@material-ui/core/CardHeader";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import AddEditContract from "./AddEditContract";
import useContracts, { IContract } from "./useContracts";
import { useState } from "react";
import { CardActionArea, Divider } from "@material-ui/core";
import StoragePersistAlert from "./StoragePersistAlert";
import contractSvg from "../assets/illustrations/contractBolt.svg";
import NetworkLabel from "../connect/NetworkLabel";
import CardActions from "@material-ui/core/CardActions";
import shortAddress from "../shared/shortAddress";
import useConnector from "../connect/useConnector";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flex: 1,
      flexDirection: "column",
      width: "100%",
      maxWidth: 800,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0
    },
    divider: {
      width: "100%",
      maxWidth: 800,
    }
  })
);

const Contracts = () => {
  const classes = useStyles();

  const contracts = useContracts((state) => state.contracts);

  const [editing, setEditing] = useState<IContract | null>(null);

  const connectedToNetwork = useConnector(state => state.network)

  const networkContracts = Object.entries(contracts)
    .filter(([id, contract])=> contract.network === connectedToNetwork)

  return (
    <Layout>
      <Card className={classes.root}>
        <CardHeader action={<NetworkLabel />} title="Contracts" />
        <CardContent>
          <Typography variant="body2" color="textSecondary" component="p">
            Register your contracts here to be able to schedule their execution
            later.
          </Typography>
        </CardContent>
        <CardActions style={{padding: 16, paddingTop: 0}}>
          <AddEditContract />
        </CardActions>
      </Card>
      <Divider className={classes.divider} />

      <StoragePersistAlert />

      <AddEditContract
        key={`edit-contract-${editing?.id}`}
        hideButton={true}
        initialFields={editing}
        onClose={() => setEditing(null)}
      />

      <div
        className={classes.root}
        style={{
          marginTop: 15,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, 250px)",
          gridAutoRows: "180px",
          gridGap: "20px",
          justifyContent: "space-between",
        }}
      >
        {networkContracts.map(([id, contract]) => (
          <ContractButton
            key={`contract-list-${id}`}
            name={contract.name}
            address={contract.address}
            onClick={() => setEditing(contract)}
          />
        ))}
      </div>
    </Layout>
  );
};

const ContractButton = ({ name, address, onClick }: { name: string, address: string, onClick: any }) => {
  return (
    <Card>
      <CardActionArea
        style={{
          height: "100%",
          background: `url(${contractSvg}) no-repeat`,
          backgroundPosition: "right -60px top -20px",
          backgroundSize: "160px 160px",
        }}
        onClick={onClick}
      >
        <CardContent>
          <Typography gutterBottom variant="h5" component="h2">
            {name}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="span">
            {shortAddress(address)}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default Contracts;
